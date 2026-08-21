/**
 * GridSenti — ESP8266 Dataset Replay Simulator
 * ============================================
 * Cycles through representative DWT energy samples from the Mendeley Fault dataset
 * for NORMAL and HIF simulation modes.
 */

#ifndef FAULT_SIMULATOR_H
#define FAULT_SIMULATOR_H

#include <Arduino.h>
#include "config.h"

class FaultSimulator {
private:
    int normalIndex;
    int hifIndex;
    int autoCounter;
    bool inAutoHifState;

public:
    FaultSimulator() : normalIndex(0), hifIndex(0), autoCounter(0), inAutoHifState(false) {}

    DatasetSample getNextSample(String currentMode, String &effectiveModeOut) {
        DatasetSample sample;

        if (currentMode == "HIF") {
            sample = DATASET_HIF_SAMPLES[hifIndex];
            hifIndex = (hifIndex + 1) % NUM_HIF_SAMPLES;
            effectiveModeOut = "HIF";
        }
        else if (currentMode == "AUTO") {
            // AUTO Mode: 6 NORMAL cycles, then 3 HIF cycles
            autoCounter++;
            if (!inAutoHifState && autoCounter >= 6) {
                inAutoHifState = true;
                autoCounter = 0;
            } else if (inAutoHifState && autoCounter >= 3) {
                inAutoHifState = false;
                autoCounter = 0;
            }

            if (inAutoHifState) {
                sample = DATASET_HIF_SAMPLES[hifIndex];
                hifIndex = (hifIndex + 1) % NUM_HIF_SAMPLES;
                effectiveModeOut = "HIF";
            } else {
                sample = DATASET_NORMAL_SAMPLES[normalIndex];
                normalIndex = (normalIndex + 1) % NUM_NORMAL_SAMPLES;
                effectiveModeOut = "NORMAL";
            }
        }
        else { // Default to NORMAL
            sample = DATASET_NORMAL_SAMPLES[normalIndex];
            normalIndex = (normalIndex + 1) % NUM_NORMAL_SAMPLES;
            effectiveModeOut = "NORMAL";
        }

        return sample;
    }
};

#endif // FAULT_SIMULATOR_H
