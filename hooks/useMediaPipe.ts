/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, PoseLandmarker, FilesetResolver, HandLandmarkerResult, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

// Mapping 2D normalized coordinates to 3D game world.
const mapHandToWorld = (x: number, y: number): THREE.Vector3 => {
  const GAME_X_RANGE = 5; 
  const GAME_Y_RANGE = 3.5;
  const Y_OFFSET = 0.8;

  // MediaPipe often returns mirrored X if facingMode is 'user'.
  // We might need to invert X depending on the final behavior.
  // For now, assuming standard mirroring where 0 is left-screen (user's right hand physically if mirrored).
  const worldX = (0.5 - x) * GAME_X_RANGE; 
  const worldY = (1.0 - y) * GAME_Y_RANGE - (GAME_Y_RANGE / 2) + Y_OFFSET;

  const worldZ = -Math.max(0, worldY * 0.2);

  return new THREE.Vector3(worldX, Math.max(0.1, worldY), worldZ);
};

// Spell types for gesture-based magic casting
export type SpellType = 'lightning' | 'shield' | 'tornado' | 'freeze' | null;

// Legacy type for compatibility during transition
export type BodyMovement = SpellType;

export const useMediaPipe = (videoRef: React.RefObject<HTMLVideoElement | null>) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handPositionsRef = useRef<{
    left: THREE.Vector3 | null;
    right: THREE.Vector3 | null;
    lastLeft: THREE.Vector3 | null;
    lastRight: THREE.Vector3 | null;
    leftVelocity: THREE.Vector3;
    rightVelocity: THREE.Vector3;
    lastTimestamp: number;
  }>({
    left: null,
    right: null,
    lastLeft: null,
    lastRight: null,
    leftVelocity: new THREE.Vector3(0,0,0),
    rightVelocity: new THREE.Vector3(0,0,0),
    lastTimestamp: 0
  });

  // Body pose tracking for dance moves
  const poseDataRef = useRef<{
    landmarks: any[] | null;
    lastShoulderY: number | null;
    lastHipY: number | null;
    rotationHistory: number[];
    detectedMovement: BodyMovement;
    movementCooldown: number;
  }>({
    landmarks: null,
    lastShoulderY: null,
    lastHipY: null,
    rotationHistory: [],
    detectedMovement: null,
    movementCooldown: 0
  });

  // To expose raw results for UI preview
  const lastResultsRef = useRef<HandLandmarkerResult | null>(null);
  const lastPoseResultsRef = useRef<PoseLandmarkerResult | null>(null);

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    let isActive = true;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );

        if (!isActive) return;

        // Initialize hand landmarker
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (!isActive) {
             landmarker.close();
             return;
        }

        // Initialize pose landmarker for body tracking
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (!isActive) {
             landmarker.close();
             poseLandmarker.close();
             return;
        }

        landmarkerRef.current = landmarker;
        poseLandmarkerRef.current = poseLandmarker;
        startCamera();
      } catch (err: any) {
        console.error("Error initializing MediaPipe:", err);
        setError(`Failed to load tracking: ${err.message}`);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
             if (isActive) {
                 setIsCameraReady(true);
                 predictWebcam();
             }
          };
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setError("Could not access camera.");
      }
    };

    const predictWebcam = () => {
        if (!videoRef.current || !landmarkerRef.current || !poseLandmarkerRef.current || !isActive) return;

        const video = videoRef.current;
        // Only process if video has data
        if (video.videoWidth > 0 && video.videoHeight > 0) {
             let startTimeMs = performance.now();
             try {
                 // Process hands
                 const handResults = landmarkerRef.current.detectForVideo(video, startTimeMs);
                 lastResultsRef.current = handResults;
                 processResults(handResults);

                 // Process pose
                 const poseResults = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);
                 lastPoseResultsRef.current = poseResults;
                 processPoseResults(poseResults);
             } catch (e) {
                 // Sometimes detectForVideo fails if timestamps aren't strictly increasing or video is not ready
                 console.warn("Detection failed this frame", e);
             }
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const processResults = (results: HandLandmarkerResult) => {
        const now = performance.now();
        const deltaTime = (now - handPositionsRef.current.lastTimestamp) / 1000;
        handPositionsRef.current.lastTimestamp = now;

        let newLeft: THREE.Vector3 | null = null;
        let newRight: THREE.Vector3 | null = null;

        if (results.landmarks) {
          for (let i = 0; i < results.landmarks.length; i++) {
            const landmarks = results.landmarks[i];
            // Note: MediaPipe 'handedness' can be counter-intuitive when mirrored.
            const classification = results.handedness[i][0];
            const isRight = classification.categoryName === 'Right'; 
            
            // Index finger tip is landmark 8
            const tip = landmarks[8];
            const worldPos = mapHandToWorld(tip.x, tip.y);

            if (isRight) {
                 newRight = worldPos; 
            } else {
                 newLeft = worldPos;
            }
          }
        }

        // --- Update State with Smoothing & Velocity ---
        const s = handPositionsRef.current;
        const LERP = 0.6; 

        // Left
        if (newLeft) {
            if (s.left) {
                newLeft.lerpVectors(s.left, newLeft, LERP);
                if (deltaTime > 0.001) { 
                     s.leftVelocity.subVectors(newLeft, s.left).divideScalar(deltaTime);
                }
            }
            s.lastLeft = s.left ? s.left.clone() : newLeft.clone();
            s.left = newLeft;
        } else {
            s.left = null;
        }

        // Right
        if (newRight) {
             if (s.right) {
                 newRight.lerpVectors(s.right, newRight, LERP);
                 if (deltaTime > 0.001) {
                      s.rightVelocity.subVectors(newRight, s.right).divideScalar(deltaTime);
                 }
             }
             s.lastRight = s.right ? s.right.clone() : newRight.clone();
             s.right = newRight;
        } else {
            s.right = null;
        }
    };

    const processPoseResults = (results: PoseLandmarkerResult) => {
        if (!results.landmarks || results.landmarks.length === 0) {
            poseDataRef.current.landmarks = null;
            return;
        }

        const landmarks = results.landmarks[0]; // First person detected
        poseDataRef.current.landmarks = landmarks;

        // Decrease cooldown
        if (poseDataRef.current.movementCooldown > 0) {
            poseDataRef.current.movementCooldown -= 1;
            return; // Don't detect new movements during cooldown
        }

        // MediaPipe Pose Landmarks:
        // 11, 12 = Left/Right Shoulder
        // 23, 24 = Left/Right Hip
        // 13, 14 = Left/Right Elbow
        // 15, 16 = Left/Right Wrist
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];

        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

        const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const avgHipY = (leftHip.y + rightHip.y) / 2;
        const avgShoulderX = (leftShoulder.x + rightShoulder.x) / 2;

        // --- LIGHTNING SPELL DETECTION (Jump gesture) ---
        // If shoulders move up significantly (Y decreases in screen coords)
        if (poseDataRef.current.lastShoulderY !== null) {
            const shoulderDiff = poseDataRef.current.lastShoulderY - avgShoulderY;
            if (shoulderDiff > 0.08) { // Jumped up
                poseDataRef.current.detectedMovement = 'lightning';
                poseDataRef.current.movementCooldown = 20; // ~20 frames cooldown
                console.log('⚡ LIGHTNING SPELL cast!');
            }
        }

        // --- SHIELD SPELL DETECTION (Squat gesture) ---
        // If hips move down significantly (Y increases in screen coords)
        if (poseDataRef.current.lastHipY !== null) {
            const hipDiff = avgHipY - poseDataRef.current.lastHipY;
            if (hipDiff > 0.1) { // Squatting down
                poseDataRef.current.detectedMovement = 'shield';
                poseDataRef.current.movementCooldown = 30;
                console.log('🛡️ SHIELD SPELL cast!');
            }
        }

        // --- TORNADO SPELL DETECTION (Spin gesture) ---
        // Track shoulder rotation over time
        poseDataRef.current.rotationHistory.push(avgShoulderX);
        if (poseDataRef.current.rotationHistory.length > 15) {
            poseDataRef.current.rotationHistory.shift();
        }

        if (poseDataRef.current.rotationHistory.length === 15) {
            const first = poseDataRef.current.rotationHistory[0];
            const last = poseDataRef.current.rotationHistory[14];
            const rotationAmount = Math.abs(last - first);

            // Check for significant lateral movement
            if (rotationAmount > 0.3) {
                poseDataRef.current.detectedMovement = 'tornado';
                poseDataRef.current.movementCooldown = 40;
                poseDataRef.current.rotationHistory = []; // Reset
                console.log('🌪️ TORNADO SPELL cast!');
            }
        }

        // --- FREEZE SPELL DETECTION (Dab-style gesture) ---
        // One arm across body, one arm extended out
        // Check if right wrist is near left shoulder AND left arm extended
        if (leftWrist && rightWrist && leftElbow && rightElbow) {
            const rightWristToLeftShoulder = Math.sqrt(
                Math.pow(rightWrist.x - leftShoulder.x, 2) +
                Math.pow(rightWrist.y - leftShoulder.y, 2)
            );

            const leftArmExtended = (leftWrist.x < leftElbow.x - 0.1); // Left arm pointing left

            if (rightWristToLeftShoulder < 0.15 && leftArmExtended) {
                poseDataRef.current.detectedMovement = 'freeze';
                poseDataRef.current.movementCooldown = 30;
                console.log('❄️ FREEZE SPELL cast!');
            }

            // Check reverse freeze gesture (left wrist to right shoulder)
            const leftWristToRightShoulder = Math.sqrt(
                Math.pow(leftWrist.x - rightShoulder.x, 2) +
                Math.pow(leftWrist.y - rightShoulder.y, 2)
            );

            const rightArmExtended = (rightWrist.x > rightElbow.x + 0.1); // Right arm pointing right

            if (leftWristToRightShoulder < 0.15 && rightArmExtended) {
                poseDataRef.current.detectedMovement = 'freeze';
                poseDataRef.current.movementCooldown = 30;
                console.log('❄️ FREEZE SPELL cast!');
            }
        }

        // Store current values for next frame
        poseDataRef.current.lastShoulderY = avgShoulderY;
        poseDataRef.current.lastHipY = avgHipY;
    };

    setupMediaPipe();

    return () => {
      isActive = false;
      if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
      }
      if (landmarkerRef.current) {
          landmarkerRef.current.close();
      }
      if (poseLandmarkerRef.current) {
          poseLandmarkerRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [videoRef]);

  return { isCameraReady, handPositionsRef, poseDataRef, lastResultsRef, lastPoseResultsRef, error };
};
