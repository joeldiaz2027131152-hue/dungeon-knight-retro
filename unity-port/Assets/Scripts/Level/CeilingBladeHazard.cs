using DungeonKnight.Combat;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Level
{
    public class CeilingBladeHazard : MonoBehaviour
    {
        [SerializeField] private float length = 4.2f;
        [SerializeField] private float speed = 1.2f;
        [SerializeField] private float maxAngle = 0.75f;
        [SerializeField] private int damage = 15;
        [SerializeField] private float cooldown = 0.75f;

        private Transform[] chainLinks;
        private Transform blade;
        private Transform shadow;
        private float phase;
        private float nextDamageTime;

        public void Configure(float chainLength, float phaseOffset)
        {
            length = chainLength;
            phase = phaseOffset;
        }

        private void Start()
        {
            CreatePart("Blade Anchor", transform, Vector2.zero, new Vector2(0.62f, 0.2f), new Color(0.18f, 0.19f, 0.23f), 7);
            CreatePart("Anchor Stone A", transform, new Vector2(-0.18f, 0.06f), new Vector2(0.16f, 0.08f), new Color(0.36f, 0.37f, 0.4f), 8);
            CreatePart("Anchor Stone B", transform, new Vector2(0.1f, 0.05f), new Vector2(0.18f, 0.08f), new Color(0.43f, 0.44f, 0.47f), 8);

            chainLinks = new Transform[Mathf.Max(7, Mathf.RoundToInt(length * 3.1f))];
            for (int i = 0; i < chainLinks.Length; i++)
            {
                Vector2 linkSize = i % 2 == 0 ? new Vector2(0.13f, 0.25f) : new Vector2(0.22f, 0.13f);
                chainLinks[i] = CreateSpritePart("Chain Link", transform, Vector2.zero, linkSize, PixelSpriteFactory.ChainLink(), 7).transform;
            }

            blade = new GameObject("Hanging Axe").transform;
            blade.SetParent(transform, false);
            shadow = CreatePart("Axe Swing Shadow", transform, Vector2.zero, new Vector2(1.2f, 0.18f), new Color(0f, 0f, 0f, 0.28f), 1).transform;
            CreatePart("Axe Handle", blade, new Vector2(0f, 0.24f), new Vector2(0.23f, 0.95f), new Color(0.31f, 0.22f, 0.15f), 8);
            CreatePart("Upper Iron Band", blade, new Vector2(0f, 0.61f), new Vector2(0.32f, 0.11f), new Color(0.18f, 0.18f, 0.2f), 9);
            CreatePart("Lower Iron Band", blade, new Vector2(0f, 0.14f), new Vector2(0.32f, 0.11f), new Color(0.18f, 0.18f, 0.2f), 9);
            CreateSpritePart("Axe Blade Head", blade, new Vector2(0.05f, -0.34f), new Vector2(1.28f, 0.9f), PixelSpriteFactory.HangingAxeBlade(), 9);

            CircleCollider2D collider = blade.gameObject.AddComponent<CircleCollider2D>();
            collider.isTrigger = true;
            collider.radius = 0.62f;
            collider.offset = new Vector2(0.05f, -0.28f);
            blade.gameObject.AddComponent<BladeHitbox>().Configure(this);
        }

        private void Update()
        {
            float angle = Mathf.Sin(Time.time * speed + phase) * maxAngle;
            Vector2 bladePosition = new Vector2(Mathf.Sin(angle) * length, -Mathf.Cos(angle) * length);
            blade.localPosition = bladePosition;
            blade.localRotation = Quaternion.Euler(0f, 0f, angle * Mathf.Rad2Deg * 0.35f);
            if (shadow)
            {
                shadow.localPosition = new Vector2(bladePosition.x, -length - 0.58f);
                shadow.localScale = new Vector2(1.2f + Mathf.Abs(Mathf.Sin(angle)) * 0.45f, 0.18f);
            }

            float chainAngle = angle * Mathf.Rad2Deg;
            for (int i = 0; i < chainLinks.Length; i++)
            {
                float t = (i + 1f) / (chainLinks.Length + 1f);
                Transform link = chainLinks[i];
                link.localPosition = Vector2.Lerp(Vector2.zero, bladePosition + new Vector2(0f, 0.58f), t);
                link.localRotation = Quaternion.Euler(0f, 0f, chainAngle + (i % 2 == 0 ? 0f : 90f));
            }
        }

        private void DamagePlayer(Collider2D other)
        {
            if (!other.CompareTag("Player")) return;
            if (Time.time < nextDamageTime) return;
            if (!other.TryGetComponent(out Health health)) return;

            if (health.TakeDamage(damage))
            {
                nextDamageTime = Time.time + cooldown;
                HitBurst.Spawn(other.transform.position, new Color(0.78f, 0.9f, 1f), 10);
            }
        }

        private static SpriteRenderer CreatePart(string objectName, Transform parent, Vector2 localPosition, Vector2 size, Color color, int sortingOrder)
        {
            GameObject part = new GameObject(objectName);
            part.transform.SetParent(parent, false);
            SpriteRenderer renderer = part.AddComponent<SpriteRenderer>();
            renderer.sprite = WhitePixel();
            renderer.color = color;
            renderer.sortingOrder = sortingOrder;
            part.transform.localPosition = localPosition;
            part.transform.localScale = size;
            return renderer;
        }

        private static SpriteRenderer CreateSpritePart(string objectName, Transform parent, Vector2 localPosition, Vector2 size, Sprite sprite, int sortingOrder)
        {
            GameObject part = new GameObject(objectName);
            part.transform.SetParent(parent, false);
            SpriteRenderer renderer = part.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.sortingOrder = sortingOrder;
            part.transform.localPosition = localPosition;
            Vector2 spriteSize = renderer.sprite.bounds.size;
            part.transform.localScale = new Vector3(size.x / spriteSize.x, size.y / spriteSize.y, 1f);
            return renderer;
        }

        private static Sprite WhitePixel()
        {
            Texture2D texture = new Texture2D(1, 1);
            texture.SetPixel(0, 0, Color.white);
            texture.Apply();
            return Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        }

        private class BladeHitbox : MonoBehaviour
        {
            private CeilingBladeHazard owner;

            public void Configure(CeilingBladeHazard hazard)
            {
                owner = hazard;
            }

            private void OnTriggerStay2D(Collider2D other)
            {
                owner?.DamagePlayer(other);
            }
        }
    }
}
