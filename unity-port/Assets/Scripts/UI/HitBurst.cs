using UnityEngine;

namespace DungeonKnight.UI
{
    public class HitBurst : MonoBehaviour
    {
        private Vector3 velocity;
        private float life;
        private SpriteRenderer spriteRenderer;

        public static void Spawn(Vector3 position, Color color, int count = 7)
        {
            for (int i = 0; i < count; i++)
            {
                GameObject go = new GameObject("Hit Spark");
                go.transform.position = position + (Vector3)(Random.insideUnitCircle * 0.15f);
                go.transform.localScale = Vector3.one * Random.Range(0.7f, 1.25f);

                SpriteRenderer renderer = go.AddComponent<SpriteRenderer>();
                renderer.sprite = PixelSprite();
                renderer.color = color;
                renderer.sortingOrder = 12;

                HitBurst burst = go.AddComponent<HitBurst>();
                burst.spriteRenderer = renderer;
                burst.velocity = Random.insideUnitCircle.normalized * Random.Range(1.4f, 3.2f);
                burst.life = Random.Range(0.18f, 0.35f);
            }
        }

        private void Update()
        {
            life -= Time.deltaTime;
            transform.position += velocity * Time.deltaTime;
            velocity *= 0.92f;

            Color color = spriteRenderer.color;
            color.a = Mathf.Clamp01(life / 0.35f);
            spriteRenderer.color = color;

            if (life <= 0f)
            {
                Destroy(gameObject);
            }
        }

        private static Sprite PixelSprite()
        {
            return PixelSpriteFactory.Create("HitSparkPixel", new[] { "X" }, new System.Collections.Generic.Dictionary<char, Color>
            {
                ['X'] = Color.white
            });
        }
    }
}
