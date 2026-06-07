using DungeonKnight.Combat;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Enemies
{
    [RequireComponent(typeof(Rigidbody2D), typeof(Health))]
    public class ChasingBatAI : MonoBehaviour
    {
        [SerializeField] private float patrolRadius = 1.8f;
        [SerializeField] private float patrolSpeed = 1.15f;
        [SerializeField] private float chaseSpeed = 3.2f;
        [SerializeField] private float sightRange = 6.4f;
        [SerializeField] private float attackRange = 0.72f;
        [SerializeField] private int damage = 8;

        private Rigidbody2D body;
        private SpriteRenderer spriteRenderer;
        private Transform player;
        private Vector3 home;
        private Vector3 baseScale;
        private float phase;
        private float nextBiteTime;

        private void Awake()
        {
            body = GetComponent<Rigidbody2D>();
            body.gravityScale = 0f;
            body.freezeRotation = true;
            GetComponent<Health>().SetMaxHealth(20);
            spriteRenderer = GetComponent<SpriteRenderer>();
            baseScale = transform.localScale;
            phase = Random.Range(0f, 10f);
        }

        private void Start()
        {
            home = transform.position;
            GameObject playerObject = GameObject.FindGameObjectWithTag("Player");
            if (playerObject) player = playerObject.transform;
        }

        private void FixedUpdate()
        {
            Vector2 target = PatrolTarget();
            bool chasing = false;

            if (player)
            {
                Vector2 toPlayer = player.position - transform.position;
                if (toPlayer.magnitude <= sightRange)
                {
                    chasing = true;
                    target = player.position + Vector3.up * 0.35f;
                    if (toPlayer.magnitude <= attackRange)
                    {
                        TryBite(toPlayer.normalized);
                    }
                }
            }

            Vector2 toTarget = target - (Vector2)transform.position;
            float speed = chasing ? chaseSpeed : patrolSpeed;
            body.linearVelocity = toTarget.sqrMagnitude > 0.04f ? toTarget.normalized * speed : Vector2.zero;

            if (spriteRenderer)
            {
                spriteRenderer.flipX = body.linearVelocity.x < -0.05f;
                spriteRenderer.color = chasing
                    ? Color.Lerp(new Color(0.72f, 0.76f, 0.86f), new Color(1f, 0.9f, 0.46f), Mathf.PingPong(Time.time * 5f, 1f))
                    : new Color(0.72f, 0.76f, 0.86f);
            }

            float flap = 1f + Mathf.Sin((Time.time + phase) * 16f) * 0.12f;
            transform.localScale = new Vector3(baseScale.x * flap, baseScale.y * (1f + (flap - 1f) * -0.35f), baseScale.z);
        }

        public void Configure(float sight, float chase, int biteDamage)
        {
            sightRange = sight;
            chaseSpeed = chase;
            damage = biteDamage;
        }

        private Vector2 PatrolTarget()
        {
            float x = Mathf.Cos((Time.time + phase) * 0.9f) * patrolRadius;
            float y = Mathf.Sin((Time.time + phase) * 1.4f) * 0.55f;
            return home + new Vector3(x, y, 0f);
        }

        private void TryBite(Vector2 direction)
        {
            if (Time.time < nextBiteTime || !player) return;
            nextBiteTime = Time.time + 0.95f;

            if (player.TryGetComponent(out PlayerController2D controller) && controller.TryBlockHit(transform.position))
            {
                body.linearVelocity = -direction * 3.2f;
                HitBurst.Spawn(transform.position, new Color(0.42f, 0.94f, 1f), 10);
                return;
            }

            if (player.TryGetComponent(out Health health) && health.TakeDamage(damage))
            {
                RetroAudio.Play("hit");
                HitBurst.Spawn(player.position + Vector3.up * 0.25f, new Color(0.9f, 0.92f, 1f), 8);
            }
        }
    }
}
