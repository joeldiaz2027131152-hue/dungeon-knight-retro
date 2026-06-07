using UnityEngine;

namespace DungeonKnight.UI
{
    public class SlashEffect : MonoBehaviour
    {
        private SpriteRenderer spriteRenderer;
        private int facing = 1;
        private float life = 0.22f;
        private float maxLife = 0.22f;
        private bool charged;
        private float age;

        public static void Spawn(Vector2 position, int facing, bool charged = false)
        {
            GameObject go = new GameObject("Sword Slash");
            go.transform.position = position + Vector2.up * 0.02f;
            float scale = charged ? 0.82f : 0.5f;
            go.transform.localScale = new Vector3(facing * scale, scale, 1f);

            SpriteRenderer renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = PixelSpriteFactory.Create(charged ? "ChargedSwordSlash" : "VisibleSwordSlash", charged ? new[]
            {
                "............................CC",
                ".........................CCCBB",
                ".....................CCCBBSSSS",
                ".................CCCBBSSSSSSS.",
                ".............CCCBBSSSSSSS.....",
                ".........CCCBBSSSSSSS.........",
                ".....GGGHHSSSSSS..............",
                "...GGHHHHSS...................",
                "..GGGHHDD.....................",
                ".GGGDD........................",
                "..DDD........................."
            } : new[]
            {
                "...........................B",
                ".......................BBBSS",
                "...................BBBSSSSS.",
                "...............BBBSSSSSS....",
                "...........BBBSSSSSS........",
                ".......BBBSSSSSS............",
                "...GGGHSSSS.................",
                "..GHHHD.....................",
                ".GGGDD......................",
                "..DDD......................."
            }, new System.Collections.Generic.Dictionary<char, Color>
            {
                ['B'] = new Color(0.12f, 0.14f, 0.18f, 1f),
                ['C'] = new Color(0.28f, 0.82f, 1f, 0.85f),
                ['S'] = charged ? new Color(0.74f, 0.94f, 1f, 1f) : new Color(0.74f, 0.79f, 0.82f, 1f),
                ['H'] = charged ? new Color(1f, 0.86f, 0.36f, 1f) : new Color(0.92f, 0.74f, 0.34f, 1f),
                ['G'] = new Color(0.48f, 0.32f, 0.14f, 1f),
                ['D'] = new Color(0.18f, 0.12f, 0.08f, 1f)
            });
            renderer.sortingOrder = 15;

            SlashEffect slash = go.AddComponent<SlashEffect>();
            slash.spriteRenderer = renderer;
            slash.facing = facing >= 0 ? 1 : -1;
            slash.charged = charged;
            slash.life = charged ? 0.32f : 0.22f;
            slash.maxLife = slash.life;
        }

        private void Update()
        {
            age += Time.deltaTime;
            life -= Time.deltaTime;
            float t = Mathf.Clamp01(age / maxLife);
            float eased = Mathf.Sin(t * Mathf.PI * 0.5f);
            float rotation = Mathf.Lerp(charged ? 52f : 38f, charged ? -44f : -32f, eased) * facing;
            float yOffset = Mathf.Lerp(charged ? 0.16f : 0.1f, charged ? -0.08f : -0.04f, eased);
            float xOffset = Mathf.Lerp(-0.015f, charged ? 0.09f : 0.055f, eased) * facing;

            transform.rotation = Quaternion.Euler(0f, 0f, rotation);
            transform.position += new Vector3(xOffset, yOffset, 0f) * Time.deltaTime * 2.2f;
            transform.localScale *= 1f + Time.deltaTime * (charged ? 0.72f : 0.42f);

            Color color = spriteRenderer.color;
            color.a = Mathf.Clamp01(life / maxLife);
            spriteRenderer.color = color;

            if (life <= 0f)
            {
                Destroy(gameObject);
            }
        }
    }
}
