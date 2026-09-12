"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={
            opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]
          }
          shader={`
            ${reverse ? "u_reverse_active" : "false"}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      )}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
    ];
    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [
          color[0] / 255,
          color[1] / 255,
          color[2] / 255,
        ]),
        type: "uniform3fv",
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
      u_reverse: {
        value: shader.includes("u_reverse_active") ? 1 : 0,
        type: "uniform1i",
      },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${
              center.includes("x")
                ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));"
                : ""
            }
            ${
              center.includes("y")
                ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));"
                : ""
            }

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            float animation_speed_factor = 0.5;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                current_timing_offset = timing_offset_intro;
                opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

const ShaderMaterial = ({
  source,
  uniforms,
}: {
  source: string;
  hovered?: boolean;
  maxFps?: number;
  uniforms: Uniforms;
}) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const timestamp = clock.getElapsedTime();
    const material: any = ref.current.material;
    const timeLocation = material.uniforms.u_time;
    timeLocation.value = timestamp;
  });

  const getUniforms = () => {
    const preparedUniforms: any = {};

    for (const uniformName in uniforms) {
      const uniform: any = uniforms[uniformName];

      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
          break;
        case "uniform1i":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1i" };
          break;
        case "uniform3f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector3().fromArray(uniform.value),
            type: "3f",
          };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: uniform.value.map((v: number[]) =>
              new THREE.Vector3().fromArray(v)
            ),
            type: "3fv",
          };
          break;
        case "uniform2f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector2().fromArray(uniform.value),
            type: "2f",
          };
          break;
        default:
          console.error(`Invalid uniform type for '${uniformName}'.`);
          break;
      }
    }

    preparedUniforms["u_time"] = { value: 0, type: "1f" };
    preparedUniforms["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };
    return preparedUniforms;
  };

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source]);

  return (
    <mesh ref={ref as any}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

export const SignInPage = ({ className }: { className?: string }) => {
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OTP flow state
  const [step, setStep] = useState<"form" | "code" | "success">("form");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Canvas visual effects state
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication API call
    setTimeout(() => {
      setIsLoading(false);
      setReverseCanvasVisible(true);
      setTimeout(() => setInitialCanvasVisible(false), 50);
      setTimeout(() => setStep("success"), 1500);
    }, 1200);
  };

  const handleOtpRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep("code");
    }
  };

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 400);
    }
  }, [step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }

      if (index === 5 && value) {
        const isComplete = newCode.every((digit) => digit.length === 1);
        if (isComplete) {
          setReverseCanvasVisible(true);
          setTimeout(() => setInitialCanvasVisible(false), 50);
          setTimeout(() => setStep("success"), 1800);
        }
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col min-h-screen bg-black relative selection:bg-white/20",
        className
      )}
    >
      {/* Canvas Shader Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              opacities={[0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.9, 0.9, 1.0, 1.0]}
              reverse={false}
            />
          </div>
        )}

        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              opacities={[0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.9, 0.9, 1.0, 1.0]}
              reverse={true}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.75)_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black via-black/40 to-transparent" />
      </div>

      {/* Main Content Card Container */}
      <div className="relative z-10 flex flex-col flex-1 items-center justify-center p-4 sm:p-6 sm:pt-25">
        <div className="w-full max-w-md border border-[#333] bg-[#1f1f1f57] backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form-step"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="space-y-1.5 text-center">
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    Sign In
                  </h1>
                  <p className="text-sm text-white/60">
                    Welcome back! Access your account details
                  </p>
                </div>

                {/* Social Login Button */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 bg-[rgba(31,31,31,0.62)] hover:bg-white/10 text-white text-sm font-medium border border-[#333] hover:border-white/50 rounded-full py-3 px-4 transition-all duration-200 active:scale-[0.99]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-white/40 text-xs uppercase tracking-wider">
                    or email
                  </span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                {/* Authentication Method Switcher */}
                <div className="grid grid-cols-2 p-1 bg-[rgba(31,31,31,0.62)] rounded-full border border-[#333]">
                  <button
                    type="button"
                    onClick={() => setAuthMethod("password")}
                    className={cn(
                      "py-1.5 text-xs font-medium rounded-full transition-all duration-200",
                      authMethod === "password"
                        ? "bg-white text-black shadow-sm"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("otp")}
                    className={cn(
                      "py-1.5 text-xs font-medium rounded-full transition-all duration-200",
                      authMethod === "otp"
                        ? "bg-white text-black shadow-sm"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    One-Time Code
                  </button>
                </div>

                {/* Forms */}
                {authMethod === "password" ? (
                  <form onSubmit={handlePasswordSignIn} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-white/70 ml-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-white bg-[rgba(31,31,31,0.62)] border border-[#333] rounded-xl py-2.5 px-4 hover:border-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs text-white/70">Password</label>
                        <Link
                          href="/forgot-password"
                          className="text-xs text-white/50 hover:text-white transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full text-white bg-[rgba(31,31,31,0.62)] border border-[#333] rounded-xl py-2.5 px-4 pr-10 hover:border-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors text-xs"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-[#333] bg-[rgba(31,31,31,0.62)] text-white focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                          Remember this device
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-full bg-white text-black font-semibold text-sm py-3 hover:bg-white/90 active:scale-[0.99] transition-all duration-200 mt-2 flex items-center justify-center disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpRequest} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-white/70 ml-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-white bg-[rgba(31,31,31,0.62)] border border-[#333] rounded-xl py-2.5 px-4 hover:border-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all text-sm"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-full bg-white text-black font-semibold text-sm py-3 hover:bg-white/90 active:scale-[0.99] transition-all duration-200 mt-2"
                    >
                      Send Verification Code
                    </button>
                  </form>
                )}

                {/* Switch to Sign Up */}
                <div className="text-center pt-2">
                  <p className="text-xs text-white/50">
                    Don't have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-white font-medium underline hover:text-white/80 transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : step === "code" ? (
              <motion.div
                key="code-step"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Enter Verification Code
                  </h1>
                  <p className="text-xs text-white/60">
                    We sent a 6-digit access code to{" "}
                    <span className="text-white font-medium">{email}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        codeInputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-10 sm:w-12 h-12 text-center text-xl font-semibold bg-[rgba(31,31,31,0.62)] border border-[#333] rounded-xl text-white hover:border-white/50 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (code.every((d) => d !== "")) {
                      setReverseCanvasVisible(true);
                      setTimeout(() => setInitialCanvasVisible(false), 50);
                      setTimeout(() => setStep("success"), 1500);
                    }
                  }}
                  disabled={!code.every((d) => d !== "")}
                  className="w-full rounded-full bg-white text-black font-semibold text-sm py-3 hover:bg-white/90 disabled:opacity-40 disabled:hover:bg-white transition-all duration-200"
                >
                  Verify & Sign In
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center py-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center text-black">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Signed in successfully
                  </h1>
                  <p className="text-xs text-white/60">
                    Redirecting to your dashboard...
                  </p>
                </div>

                <Link href="/dashboard" className="block w-full">
                  <button className="w-full rounded-full bg-white text-black font-semibold text-sm py-3 hover:bg-white/90 transition-all duration-200">
                    Go to Dashboard
                  </button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};