'use strict';

let socket;
let isGyroActive = false;
let gyroRotationMatrix = m4.identity();
let lastTimestamp = null;
const E = 0.01; // Threshold for noise filtering

function connectToSensorServer(ip) {
    if (socket) {
        socket.close();
    }

    const statusElement = document.getElementById('connectionStatus');
    socket = new WebSocket(`ws://${ip}:8080/sensor/connect?type=android.sensor.gyroscope`);
    let pingInterval;

    socket.onopen = function() {
        statusElement.textContent = "Connected";
        statusElement.style.color = "green";
        isGyroActive = true;

        pingInterval = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: "ping" }));
            }
        }, 5000);
    };

    socket.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);

            if (data.values && Array.isArray(data.values)) {
                processGyroscopeData({
                    values: data.values,
                    timestamp: data.timestamp || Date.now()
                });
            }
        } catch (e) {
            console.error("Error parsing sensor data:", e);
        }
    };

    socket.onerror = function(error) {
        statusElement.textContent = "Connection Error";
        statusElement.style.color = "red";
    };

    socket.onclose = function(event) {
        statusElement.textContent = "Disconnected";
        statusElement.style.color = "red";
        isGyroActive = false;
        clearInterval(pingInterval);
    };
}

function processGyroscopeData(data) {
    const gyroData = {
        x: data.values[0],
        y: data.values[1],
        z: data.values[2]
    };

    const currentTime = data.timestamp || Date.now();

    if (lastTimestamp) {
        const dT = (currentTime - lastTimestamp) / 1000000000;

        const axisX = gyroData.x;
        const axisY = gyroData.y;
        const axisZ = gyroData.z;

        const omegaMagnitude = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ);

        if (omegaMagnitude > E) {
            const normX = axisX / omegaMagnitude;
            const normY = axisY / omegaMagnitude;
            const normZ = axisZ / omegaMagnitude;

            const thetaOverTwo = omegaMagnitude * dT / 2.0;
            const sinThetaOverTwo = Math.sin(thetaOverTwo);
            const cosThetaOverTwo = Math.cos(thetaOverTwo);

            const deltaRotationVector = [
                sinThetaOverTwo * normX,
                sinThetaOverTwo * normY,
                sinThetaOverTwo * normZ,
                cosThetaOverTwo
            ];

            const deltaRotationMatrix = quaternionToMatrix(deltaRotationVector);

            gyroRotationMatrix = m4.multiply(gyroRotationMatrix, deltaRotationMatrix);
        }
    }

    lastTimestamp = currentTime;
}

function quaternionToMatrix(q) {
    const q1 = q[0];
    const q2 = q[1];
    const q3 = q[2];
    const q0 = q[3];

    const sq_q1 = 2 * q1 * q1;
    const sq_q2 = 2 * q2 * q2;
    const sq_q3 = 2 * q3 * q3;

    const q1_q2 = 2 * q1 * q2;
    const q3_q0 = 2 * q3 * q0;
    const q1_q3 = 2 * q1 * q3;
    const q2_q0 = 2 * q2 * q0;
    const q2_q3 = 2 * q2 * q3;
    const q1_q0 = 2 * q1 * q0;

    return [
        1 - sq_q2 - sq_q3, q1_q2 + q3_q0, q1_q3 - q2_q0, 0,
        q1_q2 - q3_q0, 1 - sq_q1 - sq_q3, q2_q3 + q1_q0, 0,
        q1_q3 + q2_q0, q2_q3 - q1_q0, 1 - sq_q1 - sq_q2, 0,
        0, 0, 0, 1
    ];
}

function getGyroRotationMatrix() {
    return gyroRotationMatrix;
}

function getIsGyroActive() {
    return isGyroActive;
}

function resetGyroRotation() {
    gyroRotationMatrix = m4.identity();
    lastTimestamp = null;
}
