# CENA — estúdio local de vídeo

MVP pessoal para transformar uma ideia em roteiro, cenas, narração e vídeo. A interface funciona em português brasileiro, salva projetos em SQLite local, aceita imagens/vídeos/áudios próprios e separa claramente recursos gratuitos de opções pagas ou locais.

## O que está implementado

- Editor responsivo com tema escuro, formato 9:16 / 1:1 / 16:9, duração, estilo e seleção de voz.
- Geração de roteiro via Gemini Developer API quando `GEMINI_API_KEY` está configurada.
- Fallback de rascunho local, identificado na interface, quando a chave não existe ou a cota falha.
- Cenas editáveis, reordenação, exclusão, adição manual e seleção no monitor.
- Upload de imagens, vídeos e áudios próprios; imagens enviadas entram na composição com zoom/pan e os arquivos permanecem no navegador durante a sessão.
- Narração: endpoint de Gemini TTS no servidor; amostra local usa a voz do navegador.
- Exportação de SRT a partir da timeline de cenas; alinhamento palavra a palavra fica preparado para `whisper.cpp`.
- SQLite via `node:sqlite`, fila persistente em `data/queue` e worker separado.
- Deploy hospedável preparado em Vercel com Functions para Gemini/Supabase e autenticação por e-mail/senha.
- Supabase com RLS por usuário; a chave `service_role` não é usada no navegador nem nos endpoints públicos.
- Renderização no navegador em WebM funciona sem FFmpeg; quando FFmpeg e o worker estão disponíveis, a fila produz MP4 fora da requisição HTTP.
- Tela de provedores com classificação: camada Free recorrente, créditos de teste e modelo open source local.

## Rodar localmente

Requer Node.js 24 ou superior. Não há dependências npm obrigatórias.

```powershell
node server/server.mjs
```

Abra [http://localhost:4173](http://localhost:4173). Para habilitar a fila de renderização, abra outro terminal:

```powershell
node server/worker.mjs
```

Para testar sem servidor, abra `dist/index.html` diretamente; o editor, fallback local, uploads e SRT continuam disponíveis, mas as rotas Gemini/SQLite/FFmpeg não.

## Publicar no GitHub e Vercel

O repositório está em [github.com/dbtecnologia/cena-studio](https://github.com/dbtecnologia/cena-studio). Na Vercel, importe esse repositório e configure:

```text
SUPABASE_URL=https://qikqeooekngjrhwajwut.supabase.co
SUPABASE_PUBLISHABLE_KEY=<chave publishable/anon do projeto>
GEMINI_API_KEY=<opcional, servidor>
GEMINI_TEXT_MODEL=gemini-3.8-flash
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts
```

O banco já possui a tabela `public.projects`, RLS e políticas por `auth.uid()`. O visitante precisa criar uma conta/entrar para sincronizar projetos; também pode escolher “Continuar só neste navegador”. Ative o provedor de e-mail do Supabase Auth se o projeto exigir confirmação de e-mail.

No plano gratuito da Vercel, a versão hospedada renderiza WebM no navegador. A exportação MP4 continua disponível pelo worker local com FFmpeg, porque renderização longa e binários do FFmpeg não são apropriados para uma Function gratuita.

## FFmpeg

Instale o FFmpeg pelo site oficial [ffmpeg.org](https://ffmpeg.org/download.html), garanta que `ffmpeg` esteja no PATH e confirme:

```powershell
ffmpeg -version
```

Se o executável tiver outro nome/caminho, defina `FFMPEG_BIN`. O MVP não baixa binários automaticamente.

## Chaves e configuração

Copie `.env.example` para `.env` e exporte as variáveis no terminal do servidor. O Node não carrega `.env` sozinho, então no PowerShell:

```powershell
$env:GEMINI_API_KEY = "sua-chave-do-google-ai-studio"
$env:GEMINI_TEXT_MODEL = "gemini-3.8-flash"
$env:GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
node server/server.mjs
```

Obtenha a chave em [Google AI Studio](https://aistudio.google.com/apikey). Ela fica somente no servidor. O projeto nunca chama o Gemini diretamente do navegador.

## Pesquisa de APIs e limites — verificada em 09/10/2026

Os links abaixo são documentação oficial. “Free tier” quer dizer camada gratuita da API, não acesso gratuito ao site. Cotas e disponibilidade podem variar por modelo/região; a aplicação não habilita cobrança automaticamente.

| Serviço | Recurso | Categoria | Limite/condição atual | Cartão | Uso no MVP |
|---|---|---|---|---|---|
| [Gemini Developer API — pricing](https://ai.google.dev/gemini-api/docs/pricing) | Roteiro/texto | Plano gratuito recorrente | Modelos elegíveis têm input/output sem custo dentro das cotas Free; os limites exatos aparecem no AI Studio por projeto/modelo | Não para o Free Tier | Implementado |
| [Gemini TTS](https://ai.google.dev/gemini-api/docs/speech-generation) | Voz em português brasileiro | Plano gratuito recorrente | Modelos TTS elegíveis aparecem com preço Free na tabela atual; sujeito às cotas do modelo e região | Não no Free Tier | Implementado no servidor |
| [Gemini Image / Imagen](https://ai.google.dev/gemini-api/docs/imagen) | Imagens IA | Pago / não confirmado no Free | Imagen 3 está disponível no Paid tier; a geração de imagens Gemini/Imagen não é tratada como grátis pelo MVP | Sim para Paid | Desligado; use uploads ou modelo local |
| [Veo](https://ai.google.dev/gemini-api/docs/veo) | Clipes de vídeo IA | Pago | A documentação de pricing lista vídeo nos tiers pagos; não há camada gratuita API confirmada | Sim para Paid | Opcional e bloqueado por padrão |
| [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/en/pricing) | Texto, imagem e áudio via provedores | Créditos gratuitos de teste recorrentes | Conta Free recebe US$ 0,10/mês, sujeito a mudança; após o crédito o uso é pay-as-you-go | Não para o crédito; pode pagar depois | Não habilitado por padrão para evitar cobrança após a cota |
| [GitHub REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) | Informações públicas e catálogo de repositórios | API gratuita | 60 req/h sem autenticação; até 5.000 req/h autenticada | Não | Consulta projetos/modelos abertos; não gera roteiro, imagem ou vídeo |
| [GitHub Models](https://docs.github.com/en/github-models) | IA via GitHub | Encerrado | A documentação oficial informa aposentadoria em 30/07/2026 | Não | Não utilizado; não inventamos endpoint alternativo |
| [Piper](https://github.com/rhasspy/piper) + [vozes pt-BR](https://github.com/rhasspy/piper/blob/master/VOICES.md) | Voz local | Open source local | Sem API ou cobrança; usa recursos do computador. Existem vozes `pt_BR` como cadu, edresson, faber e jeff | Não | Alternativa documentada |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | Transcrição e timestamps | Open source local | Sem API ou cobrança; modelos rodam no computador e podem produzir SRT/JSON com timestamps | Não | Alternativa documentada |
| [FLUX.1 schnell](https://github.com/black-forest-labs/flux) | Imagem local | Open weights local | Sem API; baixa pesos e usa CPU/GPU. FLUX.1 schnell é Apache-2.0; o hardware limita velocidade | Não | Alternativa documentada |
| [LTX-Video](https://github.com/Lightricks/LTX-Video) | Clipe texto/imagem-para-vídeo local | Open source local | Sem API; exige instalação, modelos grandes e GPU/VRAM compatível | Não | Alternativa opcional; não é API hospedada gratuita |

### Decisões de segurança de cobrança

- Nenhum código chama endpoint de pagamento, cadastra cartão ou sobe automaticamente de tier.
- Ao receber erro de cota/chave, o app informa o usuário e cai para rascunho local ou arquivos próprios.
- O modo de clipe IA não tenta contornar limites nem usa endpoint não oficial. Sem provedor configurado, ele usa fallback local com movimento e arquivos próprios, claramente identificado como não sendo geração IA.
- Hugging Face aparece na pesquisa somente como crédito de teste; não é ativado para evitar uso pago depois do crédito.

## Voz, transcrição e sincronização

O Gemini TTS documentado retorna áudio, mas não é usado como fonte de timestamps no cliente. Para uma sincronização precisa, o próximo passo é rodar `whisper.cpp` após gerar/carregar o áudio, usar os segmentos/tokens temporizados e montar o SRT a partir deles. As variáveis `WHISPER_CPP_BIN` e `WHISPER_MODEL` já estão reservadas para esse adaptador. O SRT atual é conscientemente baseado nos tempos editados de cada cena e identificado como tal no toast.

## Limitações conhecidas

- Sem chave, o roteiro usa um rascunho determinístico local; isso não é apresentado como geração real.
- Sem FFmpeg instalado, o botão renderiza um WebM local com imagens, movimento e textos; MP4 exige FFmpeg e o worker.
- O worker atual gera a base MP4 da fila. Para produção, o próximo passo é persistir uploads em `data/uploads` e passar cada asset, movimento e mixagem para o comando FFmpeg.
- O repositório começou vazio; por isso a versão local opta por uma SPA buildless sem depender de npm, preservando o backend Node/SQLite/worker do briefing.


