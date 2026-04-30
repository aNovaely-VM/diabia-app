// DIABIA - Estimation des glucides par analyse d'image (GPT-4o Vision)
// Backend function — Base44

export default async function estimateCarbs(req: Request): Promise<Response> {
  try {
    const { image_base64, mime_type } = await req.json();

    if (!image_base64) {
      return Response.json({ error: "Image manquante" }, { status: 400 });
    }

    const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_KEY) {
      return Response.json({ error: "Clé OpenAI non configurée" }, { status: 500 });
    }

    const prompt = `Tu es un expert en nutrition et en diabétologie. Analyse cette photo de repas et fournis une estimation précise des glucides.

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "total_carbs": <nombre entier en grammes>,
  "margin": <marge d'erreur en grammes, ex: 10>,
  "foods": [
    {
      "name": "<nom de l'aliment en français>",
      "quantity": "<quantité estimée, ex: 150g, 1 portion>",
      "carbs": <glucides en grammes, nombre entier>
    }
  ],
  "bolus_suggestion": {
    "dose": <dose en unités, arrondi au 0.5 près, basé sur ratio 3.5g/U comme ratio moyen>,
    "ratio": 3.5
  },
  "advice": "<un conseil court et pratique pour ce repas, en lien avec la glycémie d'un diabétique type 1>"
}

Sois précis : identifie chaque aliment visible, estime les portions visuellement, et calcule les glucides pour chaque composant. Si tu n'es pas sûr d'un aliment, donne une fourchette dans la marge.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mime_type || "image/jpeg"};base64,${image_base64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `Erreur OpenAI: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json({ error: "Pas de réponse de l'IA" }, { status: 500 });
    }

    // Extraire le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Format de réponse invalide" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return Response.json(result);

  } catch (err) {
    return Response.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}
