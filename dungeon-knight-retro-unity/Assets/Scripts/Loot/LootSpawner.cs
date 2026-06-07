using DungeonKnight.Enemies;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Loot
{
    public static class LootSpawner
    {
        public static void SpawnCoins(Vector3 position, int count)
        {
            for (int i = 0; i < count; i++)
            {
                GameObject coin = new GameObject("Coin");
                float spread = count <= 1 ? 0f : Mathf.Lerp(-1f, 1f, i / (float)(count - 1));
                coin.transform.position = position + new Vector3(spread * 0.14f, Random.Range(0f, 0.18f), 0f);
                coin.transform.localScale = Vector3.one * 0.32f;

                SpriteRenderer renderer = coin.AddComponent<SpriteRenderer>();
                renderer.sprite = PixelSpriteFactory.Coin();
                renderer.sortingOrder = 8;
                renderer.color = Color.white;

                CircleCollider2D collider = coin.AddComponent<CircleCollider2D>();
                collider.isTrigger = false;
                collider.radius = 0.42f;

                Rigidbody2D body = coin.AddComponent<Rigidbody2D>();
                body.gravityScale = 1.6f;
                body.freezeRotation = true;

                Vector2 impulse = new Vector2(spread * Random.Range(1.35f, 2.15f), Random.Range(3.3f, 4.9f));
                coin.AddComponent<CoinPickup>().Configure(1, impulse);
                CreateSpark(coin.transform.position + Vector3.up * 0.05f, spread);
            }
        }

        private static void CreateSpark(Vector3 position, float spread)
        {
            GameObject spark = new GameObject("Coin Spark");
            spark.transform.position = position;
            spark.transform.localScale = new Vector2(0.08f, 0.18f);

            SpriteRenderer renderer = spark.AddComponent<SpriteRenderer>();
            renderer.sprite = WhitePixel();
            renderer.color = new Color(1f, 0.92f, 0.38f, 0.8f);
            renderer.sortingOrder = 10;

            Rigidbody2D body = spark.AddComponent<Rigidbody2D>();
            body.gravityScale = 1.1f;
            body.AddForce(new Vector2(spread * 0.7f, Random.Range(1.2f, 2.4f)), ForceMode2D.Impulse);

            spark.AddComponent<DeathShard>().Configure(0.45f);
        }

        public static void SpawnGateKey(Vector3 position)
        {
            GameObject key = new GameObject("Gate Key");
            key.transform.position = position + Vector3.up * 0.45f;
            key.transform.localScale = Vector3.one * 0.64f;

            SpriteRenderer renderer = key.AddComponent<SpriteRenderer>();
            renderer.sprite = PixelSpriteFactory.GateKey();
            renderer.sortingOrder = 9;
            renderer.color = Color.white;

            CircleCollider2D collider = key.AddComponent<CircleCollider2D>();
            collider.isTrigger = false;
            collider.radius = 0.5f;

            Rigidbody2D body = key.AddComponent<Rigidbody2D>();
            body.gravityScale = 1.1f;
            body.freezeRotation = true;

            key.AddComponent<KeyVisual>();
            key.AddComponent<KeyPickup>().Configure(new Vector2(Random.Range(-0.35f, 0.35f), 3.8f));
            HitBurst.Spawn(key.transform.position, new Color(1f, 0.86f, 0.28f), 18);
        }

        private static Sprite WhitePixel()
        {
            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, Color.white);
            texture.Apply();
            return Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        }
    }
}
