using DungeonKnight.Combat;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Enemies
{
    [RequireComponent(typeof(Health))]
    public class KeyGuardianBoss : MonoBehaviour
    {
        [SerializeField] private float pulseRange = 2.25f;
        [SerializeField] private float pulseCooldown = 4.2f;
        [SerializeField] private int pulseDamage = 12;

        private Transform player;
        private float cooldownTimer = 1.6f;
        private float windupTimer;
        private SpriteRenderer warningRing;

        private void Awake()
        {
            warningRing = CreateWarningRing();
            GetComponent<Health>().Died += _ => HitBurst.Spawn(transform.position + Vector3.up * 0.4f, new Color(1f, 0.82f, 0.26f), 26);
        }

        private void Start()
        {
            GameObject playerObject = GameObject.FindGameObjectWithTag("Player");
            if (playerObject) player = playerObject.transform;
        }

        private void Update()
        {
            cooldownTimer = Mathf.Max(0f, cooldownTimer - Time.deltaTime);

            if (windupTimer > 0f)
            {
                windupTimer -= Time.deltaTime;
                float t = 1f - windupTimer / 0.62f;
                warningRing.enabled = true;
                warningRing.transform.localScale = new Vector2(Mathf.Lerp(0.2f, pulseRange * 2f, t), 0.18f);
                warningRing.color = new Color(1f, 0.68f, 0.16f, Mathf.Lerp(0.12f, 0.48f, t));

                if (windupTimer <= 0f)
                {
                    ReleasePulse();
                }

                return;
            }

            if (warningRing) warningRing.enabled = false;
            if (!player || cooldownTimer > 0f) return;

            float dx = Mathf.Abs(player.position.x - transform.position.x);
            float dy = Mathf.Abs(player.position.y - transform.position.y);
            if (dx <= pulseRange && dy <= 1.3f)
            {
                windupTimer = 0.62f;
                cooldownTimer = pulseCooldown;
                RetroAudio.Play("bossPulse");
                HitBurst.Spawn(transform.position + Vector3.up * 0.25f, new Color(1f, 0.62f, 0.18f), 10);
            }
        }

        private void ReleasePulse()
        {
            if (warningRing)
            {
                warningRing.enabled = false;
            }

            HitBurst.Spawn(transform.position + Vector3.up * 0.18f, new Color(1f, 0.72f, 0.22f), 22);
            if (!player) return;

            float dx = Mathf.Abs(player.position.x - transform.position.x);
            float dy = Mathf.Abs(player.position.y - transform.position.y);
            if (dx > pulseRange || dy > 1.45f) return;

            if (player.TryGetComponent(out PlayerController2D controller) && controller.TryBlockHit(transform.position))
            {
                return;
            }

            if (player.TryGetComponent(out Health health))
            {
                health.TakeDamage(pulseDamage);
            }
        }

        private SpriteRenderer CreateWarningRing()
        {
            GameObject ring = new GameObject("Guardian Pulse Warning");
            ring.transform.SetParent(transform, false);
            ring.transform.localPosition = new Vector2(0f, -0.65f);
            ring.transform.localScale = new Vector2(0.2f, 0.18f);

            SpriteRenderer renderer = ring.AddComponent<SpriteRenderer>();
            renderer.sprite = WhitePixel();
            renderer.color = new Color(1f, 0.68f, 0.16f, 0f);
            renderer.sortingOrder = 8;
            renderer.enabled = false;
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
