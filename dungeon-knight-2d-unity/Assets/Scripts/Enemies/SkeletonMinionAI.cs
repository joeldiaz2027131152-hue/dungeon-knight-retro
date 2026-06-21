using DungeonKnight.Combat;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Enemies
{
    [RequireComponent(typeof(Rigidbody2D), typeof(Health))]
    public class SkeletonMinionAI : MonoBehaviour
    {
        [SerializeField] private float patrolSpeed = 1.8f;
        [SerializeField] private float chaseSpeed = 3f;
        [SerializeField] private float sightRange = 7f;
        [SerializeField] private float attackRange = 1.05f;
        [SerializeField] private float patrolDistance = 2.4f;
        [SerializeField] private float attackWindup = 0.38f;
        [SerializeField] private float attackCooldown = 1.05f;
        [SerializeField] private int contactDamage = 10;
        [SerializeField] private int maxHealth = 60;

        private Rigidbody2D body;
        private SpriteRenderer spriteRenderer;
        private Color baseColor;
        private Transform player;
        private Vector3 baseScale;
        private Quaternion baseRotation;
        private float homeX;
        private int direction = -1;
        private float staggerTimer;
        private float attackTimer;
        private float cooldownTimer;
        private bool attackHasHit;

        public bool IsAttacking => attackTimer > 0f;

        private void Awake()
        {
            body = GetComponent<Rigidbody2D>();
            spriteRenderer = GetComponent<SpriteRenderer>();
            if (spriteRenderer) baseColor = spriteRenderer.color;
            GetComponent<Health>().SetMaxHealth(maxHealth);
        }

        private void Start()
        {
            GameObject playerObject = GameObject.FindGameObjectWithTag("Player");
            if (playerObject) player = playerObject.transform;
            baseScale = transform.localScale;
            baseRotation = transform.localRotation;
            homeX = transform.position.x;
        }

        private void FixedUpdate()
        {
            cooldownTimer = Mathf.Max(0f, cooldownTimer - Time.fixedDeltaTime);

            if (staggerTimer > 0f)
            {
                staggerTimer -= Time.fixedDeltaTime;
                return;
            }

            if (attackTimer > 0f)
            {
                attackTimer -= Time.fixedDeltaTime;
                body.linearVelocity = new Vector2(0f, body.linearVelocity.y);
                if (spriteRenderer)
                {
                    spriteRenderer.color = Color.Lerp(baseColor, new Color(1f, 0.45f, 0.2f), Mathf.PingPong(Time.time * 8f, 1f));
                }
                float progress = 1f - attackTimer / Mathf.Max(0.01f, attackWindup);
                float lean = Mathf.Sin(progress * Mathf.PI) * 7f * direction;
                float squash = 1f + Mathf.Sin(progress * Mathf.PI) * 0.08f;
                transform.localRotation = baseRotation * Quaternion.Euler(0f, 0f, -lean);
                transform.localScale = new Vector3(baseScale.x * squash, baseScale.y * (1f - (squash - 1f) * 0.35f), baseScale.z);

                if (!attackHasHit && attackTimer <= attackWindup * 0.38f)
                {
                    attackHasHit = true;
                    TryHitPlayer();
                }
                return;
            }

            float speed = patrolSpeed;
            bool chasing = false;
            float minX = homeX - patrolDistance;
            float maxX = homeX + patrolDistance;
            if (player)
            {
                float dx = player.position.x - transform.position.x;
                float dy = Mathf.Abs(player.position.y - transform.position.y);
                if (Mathf.Abs(dx) <= sightRange && dy < 2.8f)
                {
                    chasing = true;
                    direction = dx >= 0 ? 1 : -1;
                    if (Mathf.Abs(dx) <= attackRange && dy < 1.35f && cooldownTimer <= 0f)
                    {
                        StartAttack();
                        return;
                    }

                    speed = chaseSpeed;
                }
            }

            if (!chasing && transform.position.x < minX)
            {
                direction = 1;
            }
            else if (!chasing && transform.position.x > maxX)
            {
                direction = -1;
            }
            else if (!chasing && transform.position.x <= minX && direction < 0)
            {
                direction = 1;
            }
            else if (!chasing && transform.position.x >= maxX && direction > 0)
            {
                direction = -1;
            }

            body.linearVelocity = new Vector2(direction * speed, body.linearVelocity.y);
            if (spriteRenderer) spriteRenderer.flipX = direction < 0;
            if (spriteRenderer) spriteRenderer.color = baseColor;
            transform.localRotation = baseRotation;
            transform.localScale = baseScale;
        }

        public void Stagger(Vector2 hitDirection, float impulse = 5f, float duration = 0.22f)
        {
            staggerTimer = duration;
            attackTimer = 0f;
            body.linearVelocity = hitDirection * impulse;
        }

        public void Configure(int health, float patrol, float chase, int damage, float patrolArea = 2.4f)
        {
            maxHealth = health;
            patrolSpeed = patrol;
            chaseSpeed = chase;
            contactDamage = damage;
            patrolDistance = patrolArea;
            if (TryGetComponent(out Health healthComponent))
            {
                healthComponent.SetMaxHealth(maxHealth);
            }
        }

        private void StartAttack()
        {
            attackTimer = attackWindup;
            cooldownTimer = attackCooldown;
            attackHasHit = false;
            RetroAudio.Play("slash");
            HitBurst.Spawn(transform.position + Vector3.up * 0.35f, new Color(1f, 0.54f, 0.18f), 6);
        }

        private void TryHitPlayer()
        {
            if (!player) return;

            float dx = player.position.x - transform.position.x;
            float dy = Mathf.Abs(player.position.y - transform.position.y);
            if (Mathf.Abs(dx) > attackRange + 0.25f || dy > 1.4f) return;

            if (player.TryGetComponent(out PlayerController2D controller) && controller.TryBlockHit(transform.position))
            {
                bool perfect = controller.ConsumePerfectParrySuccess();
                Stagger(new Vector2(-direction, 0.28f).normalized, perfect ? 5.5f : 2.4f, perfect ? 0.46f : 0.16f);
                if (perfect)
                {
                    cooldownTimer = attackCooldown * 1.35f;
                    HitBurst.Spawn(transform.position + Vector3.up * 0.35f, new Color(0.42f, 0.94f, 1f), 16);
                }

                return;
            }

            if (player.TryGetComponent(out Health health) && health.TakeDamage(contactDamage))
            {
                Vector2 hitDirection = new Vector2(direction, 0.35f).normalized;
                if (player.TryGetComponent(out Rigidbody2D playerBody))
                {
                    playerBody.AddForce(hitDirection * 4.5f, ForceMode2D.Impulse);
                }

                HitBurst.Spawn(player.position + Vector3.up * 0.2f, new Color(1f, 0.48f, 0.28f), 9);
            }
        }
    }
}
