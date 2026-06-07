using DungeonKnight.Combat;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Level
{
    public class TimedFireTrap : MonoBehaviour
    {
        [SerializeField] private int damage = 12;
        [SerializeField] private float warningDuration = 0.65f;
        [SerializeField] private float activeDuration = 0.85f;
        [SerializeField] private float cooldownDuration = 1.35f;

        private SpriteRenderer warningRenderer;
        private SpriteRenderer baseRenderer;
        private SpriteRenderer flameRenderer;
        private SpriteRenderer smokeRenderer;
        private SpriteRenderer emberRenderer;
        private Collider2D damageCollider;
        private float timer;
        private int state;
        private float nextDamageTime;

        public void Configure(int amount, float warning, float active, float cooldown)
        {
            damage = amount;
            warningDuration = warning;
            activeDuration = active;
            cooldownDuration = cooldown;
        }

        private void Awake()
        {
            damageCollider = GetComponent<Collider2D>();
            if (damageCollider) damageCollider.isTrigger = true;
            if (damageCollider is BoxCollider2D boxCollider)
            {
                boxCollider.size = new Vector2(0.74f, 1.48f);
                boxCollider.offset = new Vector2(0f, 0.46f);
            }

            baseRenderer = CreateSpriteChild("Trap Iron Brazier", transform, new Vector2(0f, -0.18f), new Vector2(0.76f, 0.76f), PixelSpriteFactory.FireTrapBase(), Color.white, 7);
            warningRenderer = CreatePixelChild("Warning Heat Glow", transform, new Vector2(0f, -0.18f), new Vector2(1.18f, 0.2f), new Color(1f, 0.45f, 0.08f, 0.3f), 6);
            flameRenderer = CreateSpriteChild("Trap Flame Burst", transform, new Vector2(0f, 0.5f), new Vector2(0.78f, 0.92f), PixelSpriteFactory.FireTrapFlame(), new Color(1f, 1f, 1f, 0f), 10);
            smokeRenderer = CreateSpriteChild("Trap Smoke", transform, new Vector2(0.08f, 1.36f), new Vector2(0.84f, 0.78f), PixelSpriteFactory.FireTrapSmoke(), new Color(1f, 1f, 1f, 0f), 9);
            emberRenderer = CreatePixelChild("Trap Ember Core", transform, new Vector2(0f, -0.03f), new Vector2(0.42f, 0.06f), new Color(1f, 0.34f, 0.06f, 0f), 9);
            timer = cooldownDuration * 0.65f;
            ApplyVisuals();
        }

        private void Update()
        {
            timer -= Time.deltaTime;
            if (timer <= 0f)
            {
                AdvanceState();
            }

            ApplyVisuals();
        }

        private void OnTriggerStay2D(Collider2D other)
        {
            if (state != 2 || Time.time < nextDamageTime || !other.CompareTag("Player")) return;

            if (other.TryGetComponent(out Health health) && health.TakeDamage(damage))
            {
                nextDamageTime = Time.time + 0.72f;
                HitBurst.Spawn(other.transform.position + Vector3.up * 0.15f, new Color(1f, 0.42f, 0.1f), 12);
            }
        }

        private void AdvanceState()
        {
            state = state == 0 ? 1 : state == 1 ? 2 : 0;
            timer = state == 1 ? warningDuration : state == 2 ? activeDuration : cooldownDuration;

            if (state == 1)
            {
                RetroAudio.Play("locked");
            }
            else if (state == 2)
            {
                RetroAudio.Play("hit");
                HitBurst.Spawn(transform.position + Vector3.up * 0.35f, new Color(1f, 0.45f, 0.08f), 10);
            }
        }

        private void ApplyVisuals()
        {
            if (baseRenderer)
            {
                float heat = state == 2 ? 0.18f + Mathf.Sin(Time.time * 20f) * 0.06f : state == 1 ? 0.12f : 0.04f;
                baseRenderer.color = new Color(1f, Mathf.Clamp01(0.82f + heat), Mathf.Clamp01(0.72f + heat), 1f);
            }

            if (warningRenderer)
            {
                float pulse = 0.45f + Mathf.Sin(Time.time * 16f) * 0.22f;
                warningRenderer.color = state == 1
                    ? new Color(1f, 0.58f, 0.12f, Mathf.Clamp01(pulse))
                    : new Color(0.25f, 0.08f, 0.04f, 0.35f);
            }

            if (flameRenderer)
            {
                float flame = state == 2 ? 0.88f + Mathf.Sin(Time.time * 18f) * 0.1f : 0f;
                flameRenderer.transform.localScale = new Vector2(0.76f + flame * 0.06f, 0.9f + flame * 0.09f);
                flameRenderer.color = new Color(1f, 0.95f, 0.82f, flame);
            }

            if (smokeRenderer)
            {
                float smoke = state == 2 ? 0.36f + Mathf.Sin(Time.time * 5f) * 0.12f : 0f;
                smokeRenderer.transform.localPosition = new Vector2(0.1f + Mathf.Sin(Time.time * 2.7f) * 0.06f, 1.82f + Mathf.Sin(Time.time * 3.3f) * 0.05f);
                smokeRenderer.color = new Color(1f, 1f, 1f, Mathf.Clamp01(smoke));
            }

            if (emberRenderer)
            {
                float ember = state == 2 ? 0.9f + Mathf.Sin(Time.time * 24f) * 0.08f : state == 1 ? 0.42f + Mathf.Sin(Time.time * 18f) * 0.18f : 0.18f;
                emberRenderer.color = new Color(1f, 0.42f, 0.08f, Mathf.Clamp01(ember));
            }
        }

        private static SpriteRenderer CreatePixelChild(string name, Transform parent, Vector2 localPosition, Vector2 size, Color color, int sortingOrder)
        {
            return CreateSpriteChild(name, parent, localPosition, size, WhitePixel(), color, sortingOrder);
        }

        private static SpriteRenderer CreateSpriteChild(string name, Transform parent, Vector2 localPosition, Vector2 scale, Sprite sprite, Color color, int sortingOrder)
        {
            GameObject child = new GameObject(name);
            child.transform.SetParent(parent, false);
            child.transform.localPosition = localPosition;
            SpriteRenderer renderer = child.AddComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.color = color;
            renderer.sortingOrder = sortingOrder;
            child.transform.localScale = scale;
            return renderer;
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
