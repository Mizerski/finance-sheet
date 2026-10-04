//! Modelos que o app oferece para baixar. URL presa a um commit e sha256 conferido no fim do download.
//! Nome e descrição de cada um ficam no front (`src/features/assistente/modelos.ts`), pelo `id`.

#[derive(Clone, Copy)]
pub struct Amostragem {
    pub temperatura: f32,
    pub top_p: f32,
    pub top_k: u32,
}

pub struct Modelo {
    pub id: &'static str,
    pub arquivo: &'static str,
    pub url: &'static str,
    pub sha256: &'static str,
    pub bytes: u64,
    /// Valores recomendados pelo fabricante para conversa (sem raciocínio).
    pub amostragem: Amostragem,
}

pub const CATALOGO: &[Modelo] = &[
    Modelo {
        id: "qwen3.5-4b",
        arquivo: "Qwen3.5-4B-Q4_K_M.gguf",
        url: "https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/e87f176479d0855a907a41277aca2f8ee7a09523/Qwen3.5-4B-Q4_K_M.gguf",
        sha256: "00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4",
        bytes: 2_740_937_888,
        amostragem: Amostragem { temperatura: 0.7, top_p: 0.8, top_k: 20 },
    },
    Modelo {
        id: "gemma4-e2b",
        arquivo: "gemma-4-E2B-it-Q4_K_M.gguf",
        url: "https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/0314792d7f1f7e229411f620751375812bb9faf2/gemma-4-E2B-it-Q4_K_M.gguf",
        sha256: "740185b21d22ceb83a11c3aa62ad5842ef32c70f6096d756bbee85a1e4ec34b8",
        bytes: 3_106_738_272,
        amostragem: Amostragem { temperatura: 1.0, top_p: 0.95, top_k: 64 },
    },
];

pub fn modelo(id: &str) -> Result<&'static Modelo, String> {
    CATALOGO.iter().find(|m| m.id == id).ok_or_else(|| format!("Modelo desconhecido: {id}"))
}
