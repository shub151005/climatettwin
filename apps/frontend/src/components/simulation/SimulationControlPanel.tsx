import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import type {
  RainfallScenarioResponse,
  ScenarioComparisonMode,
} from "../../services/api";

interface SimulationControlPanelProps {
  selectedDate: string;
  rainfallChangePercent: number;
  comparisonMode: ScenarioComparisonMode;
  result: RainfallScenarioResponse | null;
  isLoading: boolean;
  error: string | null;

  onDateChange: (date: string) => void;
  onRainfallChange: (percentage: number) => void;
  onComparisonModeChange: (
    mode: ScenarioComparisonMode,
  ) => void;
  onRunSimulation: () => void;
  onResetSimulation: () => void;
}

const comparisonModes: Array<{
  value: ScenarioComparisonMode;
  label: string;
}> = [
  {
    value: "original",
    label: "Original",
  },
  {
    value: "simulated",
    label: "Simulated",
  },
  {
    value: "difference",
    label: "Difference",
  },
];

function formatSignedValue(value: number): string {
  if (value > 0) {
    return `+${value.toFixed(2)}`;
  }

  return value.toFixed(2);
}

function formatClassification(value: string): string {
  return value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

function getStressColor(score: number): string {
  if (score < 25) {
    return "#22c55e";
  }

  if (score < 50) {
    return "#eab308";
  }

  if (score < 75) {
    return "#f97316";
  }

  return "#ef4444";
}

function MetricCard({
  label,
  value,
  unit,
  highlighted = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlighted?: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
        borderColor: highlighted
          ? "rgba(34, 211, 238, 0.65)"
          : "rgba(148, 163, 184, 0.35)",
      }}
      transition={{
        duration: 0.18,
      }}
      style={{
        borderRadius: "12px",
        border: highlighted
          ? "1px solid rgba(34, 211, 238, 0.38)"
          : "1px solid rgba(148, 163, 184, 0.16)",
        background: highlighted
          ? "linear-gradient(145deg, rgba(8,145,178,0.15), rgba(15,23,42,0.72))"
          : "rgba(15, 23, 42, 0.6)",
        padding: "10px 11px",
        minWidth: 0,
        boxShadow: highlighted
          ? "0 0 22px rgba(34,211,238,0.08)"
          : "none",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "4px",
          color: "#f8fafc",
          fontSize: "16px",
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        <span>{value}</span>

        {unit && (
          <span
            style={{
              color: "#94a3b8",
              fontSize: "10px",
              fontWeight: 600,
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function SimulationControlPanel({
  selectedDate,
  rainfallChangePercent,
  comparisonMode,
  result,
  isLoading,
  error,
  onDateChange,
  onRainfallChange,
  onComparisonModeChange,
  onRunSimulation,
  onResetSimulation,
}: SimulationControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const stressColor = useMemo(
    () =>
      result
        ? getStressColor(result.stress.score)
        : "#22d3ee",
    [result],
  );

  const sliderBackground = useMemo(() => {
    const minimum = -100;
    const maximum = 200;

    const zeroPosition =
      ((0 - minimum) / (maximum - minimum)) * 100;

    const currentPosition =
      ((rainfallChangePercent - minimum) /
        (maximum - minimum)) *
      100;

    if (rainfallChangePercent >= 0) {
      return `linear-gradient(
        90deg,
        rgba(51, 65, 85, 0.9) 0%,
        rgba(51, 65, 85, 0.9) ${zeroPosition}%,
        rgba(34, 211, 238, 0.85) ${zeroPosition}%,
        rgba(249, 115, 22, 0.95) ${currentPosition}%,
        rgba(51, 65, 85, 0.9) ${currentPosition}%,
        rgba(51, 65, 85, 0.9) 100%
      )`;
    }

    return `linear-gradient(
      90deg,
      rgba(51, 65, 85, 0.9) 0%,
      rgba(59, 130, 246, 0.95) ${currentPosition}%,
      rgba(34, 211, 238, 0.85) ${zeroPosition}%,
      rgba(51, 65, 85, 0.9) ${zeroPosition}%,
      rgba(51, 65, 85, 0.9) 100%
    )`;
  }, [rainfallChangePercent]);

  return (
    <motion.aside
      initial={{
        opacity: 0,
        x: 24,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.38,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        width: "min(360px, calc(100vw - 32px))",
        borderRadius: "18px",
        border: "1px solid rgba(34,211,238,0.22)",
        background:
          "linear-gradient(155deg, rgba(2,6,23,0.93), rgba(15,23,42,0.84))",
        boxShadow:
          "0 22px 70px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(8,145,178,0.07)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        overflow: "hidden",
        color: "#f8fafc",
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          padding: "15px 16px 13px",
          color: "inherit",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            minWidth: 0,
          }}
        >
          <motion.div
            animate={{
              boxShadow: isLoading
                ? [
                    "0 0 0 rgba(34,211,238,0)",
                    "0 0 20px rgba(34,211,238,0.55)",
                    "0 0 0 rgba(34,211,238,0)",
                  ]
                : "0 0 15px rgba(34,211,238,0.16)",
            }}
            transition={{
              repeat: isLoading ? Infinity : 0,
              duration: 1.6,
            }}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "11px",
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(34,211,238,0.34)",
              background:
                "linear-gradient(145deg, rgba(8,145,178,0.22), rgba(15,23,42,0.8))",
              color: "#67e8f9",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            ◈
          </motion.div>

          <div
            style={{
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#67e8f9",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: "3px",
              }}
            >
              V2 Climate Simulation
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: 800,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Rainfall Scenario Lab
            </div>
          </div>
        </div>

        <motion.span
          animate={{
            rotate: isExpanded ? 180 : 0,
          }}
          transition={{
            duration: 0.22,
          }}
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "1px",
                margin: "0 16px",
                background:
                  "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)",
              }}
            />

            <div
              style={{
                padding: "15px 16px 16px",
                display: "grid",
                gap: "15px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Scenario date
                  </span>

                  <input
                    type="date"
                    min="2025-01-01"
                    max="2025-12-31"
                    value={selectedDate}
                    disabled={isLoading}
                    onChange={(event) =>
                      onDateChange(event.target.value)
                    }
                    style={{
                      width: "100%",
                      minWidth: 0,
                      boxSizing: "border-box",
                      colorScheme: "dark",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(148,163,184,0.22)",
                      background: "rgba(15,23,42,0.78)",
                      color: "#e2e8f0",
                      padding: "10px",
                      outline: "none",
                      fontSize: "12px",
                    }}
                  />
                </label>

                <div
                  style={{
                    display: "grid",
                    gap: "7px",
                  }}
                >
                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Adjustment
                  </span>

                  <div
                    style={{
                      minHeight: "36px",
                      borderRadius: "10px",
                      border:
                        "1px solid rgba(34,211,238,0.28)",
                      background:
                        "linear-gradient(145deg, rgba(8,145,178,0.14), rgba(15,23,42,0.82))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color:
                        rainfallChangePercent >= 0
                          ? "#fb923c"
                          : "#60a5fa",
                      fontSize: "16px",
                      fontWeight: 900,
                    }}
                  >
                    {rainfallChangePercent > 0 ? "+" : ""}
                    {rainfallChangePercent}%
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "9px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      color: "#cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Rainfall change
                  </span>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "10px",
                    }}
                  >
                    −100% to +200%
                  </span>
                </div>

                <input
                  type="range"
                  min="-100"
                  max="200"
                  step="5"
                  value={rainfallChangePercent}
                  disabled={isLoading}
                  onChange={(event) =>
                    onRainfallChange(
                      Number(event.target.value),
                    )
                  }
                  style={{
                    width: "100%",
                    height: "5px",
                    borderRadius: "999px",
                    appearance: "none",
                    WebkitAppearance: "none",
                    outline: "none",
                    cursor: isLoading
                      ? "not-allowed"
                      : "pointer",
                    background: sliderBackground,
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#64748b",
                    fontSize: "9px",
                  }}
                >
                  <span>Dry scenario</span>
                  <span>Baseline</span>
                  <span>Extreme increase</span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "9px",
                }}
              >
                <motion.button
                  type="button"
                  disabled={
                    isLoading ||
                    !selectedDate ||
                    Number.isNaN(rainfallChangePercent)
                  }
                  whileHover={
                    isLoading
                      ? undefined
                      : {
                          y: -1,
                          boxShadow:
                            "0 10px 30px rgba(6,182,212,0.26)",
                        }
                  }
                  whileTap={
                    isLoading
                      ? undefined
                      : {
                          scale: 0.98,
                        }
                  }
                  onClick={onRunSimulation}
                  style={{
                    minHeight: "42px",
                    borderRadius: "11px",
                    border:
                      "1px solid rgba(103,232,249,0.46)",
                    background:
                      "linear-gradient(135deg, #0891b2, #0e7490 52%, #155e75)",
                    color: "#ecfeff",
                    fontSize: "12px",
                    fontWeight: 900,
                    letterSpacing: "0.03em",
                    cursor: isLoading
                      ? "not-allowed"
                      : "pointer",
                    opacity: isLoading ? 0.72 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {isLoading && (
                    <motion.span
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: "linear",
                        repeat: Infinity,
                      }}
                      style={{
                        width: "13px",
                        height: "13px",
                        borderRadius: "50%",
                        border:
                          "2px solid rgba(255,255,255,0.28)",
                        borderTopColor: "#ffffff",
                      }}
                    />
                  )}

                  {isLoading
                    ? "Running scenario"
                    : "Run climate simulation"}
                </motion.button>

                <motion.button
                  type="button"
                  title="Reset simulation"
                  whileHover={{
                    rotate: -8,
                    borderColor:
                      "rgba(248,113,113,0.5)",
                    color: "#fca5a5",
                  }}
                  whileTap={{
                    scale: 0.94,
                  }}
                  onClick={onResetSimulation}
                  disabled={isLoading}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "11px",
                    border:
                      "1px solid rgba(148,163,184,0.22)",
                    background: "rgba(15,23,42,0.76)",
                    color: "#94a3b8",
                    cursor: isLoading
                      ? "not-allowed"
                      : "pointer",
                    fontSize: "16px",
                  }}
                >
                  ↻
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="simulation-error"
                    initial={{
                      opacity: 0,
                      y: -6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -6,
                    }}
                    style={{
                      borderRadius: "11px",
                      border:
                        "1px solid rgba(248,113,113,0.3)",
                      background: "rgba(127,29,29,0.22)",
                      padding: "10px 11px",
                      color: "#fecaca",
                      fontSize: "11px",
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {result && !error && (
                  <motion.div
                    key={`${result.selected_date}-${result.rainfall_change_percent}`}
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.34,
                    }}
                    style={{
                      display: "grid",
                      gap: "13px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Comparison view
                      </span>

                      <div
                        style={{
                          position: "relative",
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(3, 1fr)",
                          gap: "3px",
                          padding: "4px",
                          borderRadius: "11px",
                          border:
                            "1px solid rgba(148,163,184,0.15)",
                          background: "rgba(2,6,23,0.54)",
                        }}
                      >
                        {comparisonModes.map((mode) => {
                          const active =
                            comparisonMode === mode.value;

                          return (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() =>
                                onComparisonModeChange(
                                  mode.value,
                                )
                              }
                              style={{
                                position: "relative",
                                zIndex: 1,
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 5px",
                                background: "transparent",
                                color: active
                                  ? "#ecfeff"
                                  : "#64748b",
                                fontSize: "10px",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {active && (
                                <motion.span
                                  layoutId="scenario-comparison-active"
                                  transition={{
                                    type: "spring",
                                    stiffness: 420,
                                    damping: 34,
                                  }}
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: -1,
                                    borderRadius: "8px",
                                    border:
                                      "1px solid rgba(34,211,238,0.3)",
                                    background:
                                      "linear-gradient(145deg, rgba(8,145,178,0.3), rgba(15,23,42,0.9))",
                                    boxShadow:
                                      "0 0 18px rgba(34,211,238,0.08)",
                                  }}
                                />
                              )}

                              {mode.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, minmax(0, 1fr))",
                        gap: "7px",
                      }}
                    >
                      <MetricCard
                        label="Original mean"
                        value={result.statistics.original_mean_mm}
                        unit="mm"
                      />

                      <MetricCard
                        label="Simulated mean"
                        value={result.statistics.simulated_mean_mm}
                        unit="mm"
                        highlighted
                      />

                      <MetricCard
                        label="Difference"
                        value={formatSignedValue(
                          result.statistics.mean_difference_mm,
                        )}
                        unit="mm"
                      />

                      <MetricCard
                        label="Changed cells"
                        value={
                          result.statistics
                            .intensity_changed_cell_count
                        }
                      />

                      <MetricCard
                        label="Original extreme"
                        value={
                          result.statistics
                            .original_extreme_cell_count
                        }
                      />

                      <MetricCard
                        label="Simulated extreme"
                        value={
                          result.statistics
                            .simulated_extreme_cell_count
                        }
                        highlighted
                      />
                    </div>

                    <div
                      style={{
                        borderRadius: "14px",
                        border: `1px solid ${stressColor}55`,
                        background:
                          "linear-gradient(145deg, rgba(15,23,42,0.82), rgba(2,6,23,0.68))",
                        padding: "12px",
                        display: "grid",
                        gridTemplateColumns: "70px 1fr",
                        alignItems: "center",
                        gap: "12px",
                        boxShadow: `0 0 28px ${stressColor}12`,
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "66px",
                          height: "66px",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <svg
                          width="66"
                          height="66"
                          viewBox="0 0 66 66"
                          style={{
                            transform: "rotate(-90deg)",
                          }}
                        >
                          <circle
                            cx="33"
                            cy="33"
                            r="27"
                            fill="none"
                            stroke="rgba(51,65,85,0.7)"
                            strokeWidth="6"
                          />

                          <motion.circle
                            cx="33"
                            cy="33"
                            r="27"
                            fill="none"
                            stroke={stressColor}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 27}
                            initial={{
                              strokeDashoffset:
                                2 * Math.PI * 27,
                            }}
                            animate={{
                              strokeDashoffset:
                                2 *
                                Math.PI *
                                27 *
                                (1 -
                                  result.stress.score /
                                    100),
                            }}
                            transition={{
                              duration: 0.9,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                              filter: `drop-shadow(0 0 5px ${stressColor})`,
                            }}
                          />
                        </svg>

                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            color: "#f8fafc",
                            fontSize: "15px",
                            fontWeight: 900,
                          }}
                        >
                          {result.stress.score.toFixed(0)}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: stressColor,
                            fontSize: "10px",
                            fontWeight: 900,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            marginBottom: "5px",
                          }}
                        >
                          {formatClassification(
                            result.stress.classification,
                          )}{" "}
                          stress
                        </div>

                        <div
                          style={{
                            color: "#cbd5e1",
                            fontSize: "11px",
                            lineHeight: 1.5,
                          }}
                        >
                          {result.stress.explanation}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, minmax(0, 1fr))",
                        gap: "7px",
                      }}
                    >
                      <MetricCard
                        label="Intensity"
                        value={result.stress.rainfall_intensity_component.toFixed(
                          0,
                        )}
                        unit="/100"
                      />

                      <MetricCard
                        label="Scenario change"
                        value={result.stress.rainfall_change_component.toFixed(
                          0,
                        )}
                        unit="/100"
                      />

                      <MetricCard
                        label="Extreme cells"
                        value={result.stress.extreme_cell_component.toFixed(
                          0,
                        )}
                        unit="/100"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}