using DungeonKnight.Combat;
using UnityEngine;

namespace DungeonKnight.Enemies
{
    [RequireComponent(typeof(Health))]
    public class SkeletonDeathEffect : MonoBehaviour
    {
        private void Awake()
        {
            GetComponent<Health>().Died += OnDied;
        }

        private void OnDied(Health health)
        {
            Vector3 center = transform.position + Vector3.up * 0.45f;
            RetroAudio.Play("bones");
            SpawnDustRing(transform.position + Vector3.up * 0.05f);
            SpawnBone(center, new Vector2(-1.7f, 2.4f), new Vector2(0.18f, 0.42f));
            SpawnBone(center, new Vector2(1.6f, 2.1f), new Vector2(0.16f, 0.38f));
            SpawnBone(center, new Vector2(-0.7f, 2.9f), new Vector2(0.44f, 0.16f));
            SpawnBone(center, new Vector2(0.8f, 2.7f), new Vector2(0.42f, 0.14f));
            SpawnBone(center, new Vector2(-2.2f, 1.6f), new Vector2(0.12f, 0.28f));
            SpawnBone(center, new Vector2(2.1f, 1.7f), new Vector2(0.12f, 0.28f));
            SpawnSkull(center + Vector3.up * 0.3f, new Vector2(Random.Range(-0.8f, 0.8f), 3.4f));
        }

        private static void SpawnDustRing(Vector3 position)
        {
            for (int i = 0; i < 8; i++)
            {
                float side = i < 4 ? -1f : 1f;
                GameObject dust = new GameObject("Death Dust");
                dust.transform.position = position + new Vector3(side * Random.Range(0.05f, 0.28f), Random.Range(-0.04f, 0.08f), 0f);
                dust.transform.localScale = new Vector2(Random.Range(0.12f, 0.24f), Random.Range(0.08f, 0.16f));

                SpriteRenderer renderer = dust.AddComponent<SpriteRenderer>();
                renderer.sprite = WhitePixel();
                renderer.color = new Color(0.55f, 0.5f, 0.42f, 0.38f);
                renderer.sortingOrder = 10;

                Rigidbody2D body = dust.AddComponent<Rigidbody2D>();
                body.gravityScale = 0.55f;
                body.AddForce(new Vector2(side * Random.Range(0.25f, 0.9f), Random.Range(0.25f, 0.9f)), ForceMode2D.Impulse);

                dust.AddComponent<DeathShard>().Configure(Random.Range(0.35f, 0.62f));
            }
        }

        private static void SpawnBone(Vector3 position, Vector2 impulse, Vector2 size)
        {
            GameObject bone = new GameObject("Falling Bone");
            bone.transform.position = position + (Vector3)(Random.insideUnitCircle * 0.18f);
            bone.transform.localScale = size;

            SpriteRenderer renderer = bone.AddComponent<SpriteRenderer>();
            renderer.sprite = WhitePixel();
            renderer.color = new Color(0.86f, 0.8f, 0.62f);
            renderer.sortingOrder = 11;

            Rigidbody2D body = bone.AddComponent<Rigidbody2D>();
            body.gravityScale = 2.2f;
            body.AddForce(impulse + Random.insideUnitCircle * 0.45f, ForceMode2D.Impulse);
            body.AddTorque(Random.Range(-80f, 80f));

            bone.AddComponent<DeathShard>().Configure(Random.Range(0.72f, 1.05f));
        }

        private static void SpawnSkull(Vector3 position, Vector2 impulse)
        {
            GameObject skull = new GameObject("Falling Skull");
            skull.transform.position = position;
            skull.transform.localScale = new Vector3(0.28f, 0.24f, 1f);

            SpriteRenderer renderer = skull.AddComponent<SpriteRenderer>();
            renderer.sprite = WhitePixel();
            renderer.color = new Color(0.92f, 0.86f, 0.68f);
            renderer.sortingOrder = 12;

            Rigidbody2D body = skull.AddComponent<Rigidbody2D>();
            body.gravityScale = 2f;
            body.AddForce(impulse, ForceMode2D.Impulse);
            body.AddTorque(Random.Range(-90f, 90f));

            skull.AddComponent<DeathShard>().Configure(1.1f);
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
