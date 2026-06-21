using DungeonKnight.Combat;
using DungeonKnight.Enemies;
using DungeonKnight.Loot;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    [RequireComponent(typeof(Health))]
    public class BreakableCrate : MonoBehaviour
    {
        [SerializeField] private int coins = 4;
        private bool broken;

        private void Awake()
        {
            Health health = GetComponent<Health>();
            health.SetMaxHealth(20);
            health.Died += OnCrateBroken;
        }

        public void SetCoins(int amount)
        {
            coins = Mathf.Max(0, amount);
        }

        private void OnCrateBroken(Health health)
        {
            if (broken) return;
            broken = true;

            RetroAudio.Play("crate");
            SpawnSplinters(transform.position);
            LootSpawner.SpawnCoins(transform.position + Vector3.up * 0.35f, coins);
        }

        private static void SpawnSplinters(Vector3 center)
        {
            for (int i = 0; i < 9; i++)
            {
                GameObject splinter = new GameObject("Crate Splinter");
                splinter.transform.position = center + (Vector3)(Random.insideUnitCircle * 0.22f);
                splinter.transform.localScale = new Vector2(Random.Range(0.08f, 0.18f), Random.Range(0.18f, 0.34f));

                SpriteRenderer renderer = splinter.AddComponent<SpriteRenderer>();
                renderer.sprite = WhitePixel();
                renderer.color = new Color(0.58f, 0.34f, 0.16f);
                renderer.sortingOrder = 11;

                Rigidbody2D body = splinter.AddComponent<Rigidbody2D>();
                body.gravityScale = 1.8f;
                body.AddForce(new Vector2(Random.Range(-1.5f, 1.5f), Random.Range(1.4f, 3.1f)), ForceMode2D.Impulse);
                body.AddTorque(Random.Range(-80f, 80f));

                splinter.AddComponent<DeathShard>().Configure(Random.Range(0.45f, 0.8f));
            }
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
