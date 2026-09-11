# Componentes del módulo Android

- Bare Kit 2.4.3, Holepunch: Apache-2.0. Binarios oficiales, SHA-256 fijado en `scripts/bootstrap.cjs`.
- QVAC llm-llamacpp 0.49.1, Tether: Apache-2.0. Motor nativo QVAC/Fabric LLM; depende de componentes GGML/llama.cpp y bibliotecas Bare distribuidas por el paquete.
- Qwen3 1.7B, Qwen: Apache-2.0. Cuantización Q4_K_M distribuida por Unsloth en Hugging Face; SHA-256 fijado en `ModelInstall.java`.

Las licencias principales están incluidas en `src/main/assets/licenses/` y se empaquetan en la APK. Los scripts, el modelo descargado y las herramientas de compilación no se incorporan al repositorio como binarios.
