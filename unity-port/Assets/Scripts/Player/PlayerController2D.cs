using DungeonKnight.Combat;
using DungeonKnight.Enemies;
using DungeonKnight.Level;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Player
{
    [RequireComponent(typeof(Rigidbody2D), typeof(Collider2D), typeof(Health))]
    public class PlayerController2D : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float moveSpeed = 7f;
        [SerializeField] private float jumpForce = 13.8f;
        [SerializeField] private float baseGravity = 3.2f;
        [SerializeField] private float fallGravity = 5.4f;
        [SerializeField] private float lowJumpGravity = 4.6f;
        [SerializeField] private float maxFallSpeed = -18f;
        [SerializeField] private Transform groundCheck;
        [SerializeField] private LayerMask groundMask;

        [Header("Combat")]
        [SerializeField] private Transform attackPoint;
        [SerializeField] private Vector2 attackSize = new Vector2(1.2f, 0.8f);
        [SerializeField] private LayerMask enemyMask;
        [SerializeField] private float blockMoveMultiplier = 0.42f;
        [SerializeField] private float blockStaminaCost = 5f;
        [SerializeField] private float chargedAttackCost = 35f;
        [SerializeField] private float chargedAttackThreshold = 0.55f;
        [SerializeField] private float perfectParryWindow = 0.18f;

        private Rigidbody2D body;
        private Collider2D playerCollider;
        private SpriteRenderer spriteRenderer;
        private SpriteRenderer shieldRenderer;
        private SpriteRenderer chargeRenderer;
        private Health health;
        private PlayerInventory inventory;
        private Vector3 baseScale;
        private Quaternion baseRotation;
        private float horizontal;
        private int facing = 1;
        private bool isGrounded;
        private bool isRolling;
        private float rollTimer;
        private float attackTimer;
        private float chargeTimer;
        private float stepTimer;
        private float hurtReactionTimer;
        private float deathCollapseTimer;
        private float deathCollapseDuration = 1f;
        private float parryTimer;
        private float staminaWarningUntil;
        private float stamina = GameConstants.StartingStamina;
        private bool chargeReadyFeedbackPlayed;
        private bool lastBlockWasPerfect;
        private Collider2D droppedSurface;
        private float dropSurfaceUntil;

        public float Stamina => stamina;
        public float MaxStamina => GameConstants.StartingStamina;
        public float MoveInput => horizontal;
        public int Facing => facing;
        public bool IsGrounded => isGrounded;
        public bool IsRolling => isRolling;
        public bool IsInvulnerable => isRolling;
        public bool IsAttacking => attackTimer > 0f;
        public bool IsCharging => chargeTimer > 0f;
        public bool IsChargeReady => IsCharging && chargeTimer >= chargedAttackThreshold && stamina >= chargedAttackCost;
        public bool HasStaminaWarning => Time.time < staminaWarningUntil;
        public bool IsBlocking { get; private set; }

        private void Awake()
        {
            body = GetComponent<Rigidbody2D>();
            body.gravityScale = baseGravity;
            playerCollider = GetComponent<Collider2D>();
            spriteRenderer = GetComponent<SpriteRenderer>();
            if (spriteRenderer) spriteRenderer.flipX = false;
            baseScale = transform.localScale;
            baseRotation = transform.localRotation;
            health = GetComponent<Health>();
            inventory = GetComponent<PlayerInventory>();
            health.SetMaxHealth(GameConstants.StartingHealth);
            if (!attackPoint) attackPoint = transform;
            if (groundMask == 0) groundMask = LayerMask.GetMask("Ground");
            if (groundMask == 0) groundMask = ~0;
            if (enemyMask == 0) enemyMask = LayerMask.GetMask("Enemy");
            if (enemyMask == 0) enemyMask = ~0;
            CreateShieldVisual();
            CreateChargeVisual();
        }

        private void Update()
        {
            if (health.IsDead)
            {
                horizontal = 0f;
                UpdateDeathCollapse();
                return;
            }

            horizontal = Input.GetAxisRaw("Horizontal");
            if (horizontal != 0) facing = horizontal > 0 ? 1 : -1;
            if (spriteRenderer) spriteRenderer.flipX = facing < 0;
            attackTimer = Mathf.Max(0f, attackTimer - Time.deltaTime);
            hurtReactionTimer = Mathf.Max(0f, hurtReactionTimer - Time.deltaTime);
            parryTimer = Mathf.Max(0f, parryTimer - Time.deltaTime);

            isGrounded = CheckGrounded();

            if ((Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow)) && isGrounded)
            {
                TryDropThroughSurface();
            }

            if (Input.GetKeyDown(KeyCode.Space) && isGrounded)
            {
                body.linearVelocity = new Vector2(body.linearVelocity.x, jumpForce);
                RetroAudio.Play("jump");
            }

            if (Input.GetKeyDown(KeyCode.K))
            {
                if (stamina >= blockStaminaCost)
                {
                    parryTimer = perfectParryWindow;
                }
                else
                {
                    TriggerStaminaWarning();
                }
            }

            IsBlocking = Input.GetKey(KeyCode.K) && stamina > 0 && !isRolling;

            if (Input.GetKeyDown(KeyCode.J) && !IsBlocking && !isRolling)
            {
                chargeTimer = 0.01f;
                chargeReadyFeedbackPlayed = false;
            }

            if (Input.GetKey(KeyCode.J) && chargeTimer > 0f && !IsBlocking)
            {
                chargeTimer += Time.deltaTime;
            }
            else if (chargeTimer > 0f && IsBlocking)
            {
                chargeTimer = 0f;
                chargeReadyFeedbackPlayed = false;
            }

            if (IsChargeReady && !chargeReadyFeedbackPlayed)
            {
                chargeReadyFeedbackPlayed = true;
                RetroAudio.Play("charge");
                HitBurst.Spawn(transform.position + new Vector3(facing * 0.45f, 0.55f, 0f), new Color(0.42f, 0.9f, 1f), 12);
            }

            if (Input.GetKeyUp(KeyCode.J) && chargeTimer > 0f)
            {
                bool charged = chargeTimer >= chargedAttackThreshold && stamina >= chargedAttackCost;
                if (chargeTimer >= chargedAttackThreshold && stamina < chargedAttackCost)
                {
                    TriggerStaminaWarning();
                }

                Attack(charged);
                chargeTimer = 0f;
                chargeReadyFeedbackPlayed = false;
            }

            if (Input.GetKeyDown(KeyCode.L) && !isRolling && !IsBlocking)
            {
                if (stamina >= GameConstants.RollStaminaCost)
                {
                    stamina -= GameConstants.RollStaminaCost;
                    isRolling = true;
                    rollTimer = 0.28f;
                    chargeTimer = 0f;
                    chargeReadyFeedbackPlayed = false;
                    RetroAudio.Play("roll");
                    HitBurst.Spawn(transform.position + Vector3.down * 0.22f, new Color(0.52f, 0.62f, 0.72f), 8);
                }
                else
                {
                    TriggerStaminaWarning();
                }
            }

            if (Input.GetKeyDown(KeyCode.Q))
            {
                UseMinorPotion();
            }

            if (!IsBlocking && stamina < MaxStamina)
            {
                stamina = Mathf.Min(MaxStamina, stamina + 18f * Time.deltaTime);
            }

            UpdateFootsteps();
            UpdateShieldVisual();
            UpdateChargeVisual();
            UpdateHurtReaction();
            UpdateDroppedSurfaceCollision();
            UpdateGravity();
        }

        private void FixedUpdate()
        {
            if (health.IsDead)
            {
                body.linearVelocity = Vector2.zero;
                return;
            }

            if (isRolling)
            {
                rollTimer -= Time.fixedDeltaTime;
                body.linearVelocity = new Vector2(facing * 9.5f, body.linearVelocity.y);
                if (rollTimer <= 0) isRolling = false;
                return;
            }

            float currentSpeed = IsBlocking ? moveSpeed * blockMoveMultiplier : moveSpeed;
            body.linearVelocity = new Vector2(horizontal * currentSpeed, Mathf.Max(body.linearVelocity.y, maxFallSpeed));
        }

        private void UpdateFootsteps()
        {
            if (!isGrounded || isRolling || Mathf.Abs(horizontal) < 0.1f)
            {
                stepTimer = 0.04f;
                return;
            }

            stepTimer -= Time.deltaTime;
            if (stepTimer > 0f) return;

            RetroAudio.Play("step");
            stepTimer = 0.28f;
        }

        private void TryDropThroughSurface()
        {
            Collider2D surface = FindDropThroughSurface();
            if (!surface) return;

            droppedSurface = surface;
            dropSurfaceUntil = Time.time + 0.42f;
            if (droppedSurface.TryGetComponent(out DropThroughSurface dropSurface))
            {
                dropSurface.IgnorePlayerUntil(dropSurfaceUntil);
            }
            else
            {
                Physics2D.IgnoreCollision(playerCollider, droppedSurface, true);
            }
            isGrounded = false;
            body.linearVelocity = new Vector2(body.linearVelocity.x, -5.4f);
            transform.position += Vector3.down * 0.08f;
            RetroAudio.Play("step");
            HitBurst.Spawn(transform.position + Vector3.down * 0.55f, new Color(0.52f, 0.62f, 0.72f), 6);
        }

        private void UpdateDroppedSurfaceCollision()
        {
            if (!droppedSurface) return;
            if (Time.time < dropSurfaceUntil) return;

            Physics2D.IgnoreCollision(playerCollider, droppedSurface, false);
            droppedSurface = null;
        }

        private Collider2D FindDropThroughSurface()
        {
            Bounds bounds = playerCollider.bounds;
            Vector2 center = new Vector2(bounds.center.x, bounds.min.y + 0.04f);
            Vector2 left = center + Vector2.left * bounds.extents.x * 0.72f;
            Vector2 right = center + Vector2.right * bounds.extents.x * 0.72f;
            const float rayDistance = 0.32f;

            Collider2D surface = GetDropSurfaceFromRay(center, rayDistance);
            if (surface) return surface;
            surface = GetDropSurfaceFromRay(left, rayDistance);
            if (surface) return surface;
            return GetDropSurfaceFromRay(right, rayDistance);
        }

        private Collider2D GetDropSurfaceFromRay(Vector2 origin, float distance)
        {
            RaycastHit2D hit = Physics2D.Raycast(origin, Vector2.down, distance, groundMask);
            if (!hit.collider) return null;
            return hit.collider.GetComponent<DropThroughSurface>() ? hit.collider : null;
        }

        private void Attack(bool charged = false)
        {
            if (IsBlocking) return;

            if (charged)
            {
                stamina = Mathf.Max(0f, stamina - chargedAttackCost);
            }

            attackTimer = charged ? 0.28f : 0.18f;
            RetroAudio.Play(charged ? "heavySlash" : "slash");
            Vector2 center = (Vector2)attackPoint.position + Vector2.right * facing * (charged ? 0.92f : 0.7f);
            Vector2 size = charged ? attackSize + new Vector2(0.55f, 0.18f) : attackSize + new Vector2(0.15f, -0.08f);
            int damage = charged ? GameConstants.SwordDamage * 2 : GameConstants.SwordDamage;
            Collider2D[] hits = Physics2D.OverlapCapsuleAll(center, size, CapsuleDirection2D.Horizontal, 0f, enemyMask);
            SlashEffect.Spawn(center, facing, charged);
            bool landedHit = false;

            foreach (Collider2D hit in hits)
            {
                if (hit.TryGetComponent(out Health target))
                {
                    if (target.TakeDamage(damage))
                    {
                        landedHit = true;
                        Vector2 hitDirection = new Vector2(facing, 0.35f).normalized;
                        HitBurst.Spawn(hit.bounds.center, charged ? new Color(1f, 0.72f, 0.24f) : new Color(0.82f, 0.92f, 1f), charged ? 16 : 8);
                        if (hit.TryGetComponent(out SkeletonMinionAI minion))
                        {
                            minion.Stagger(hitDirection, charged ? 7f : 5f, charged ? 0.3f : 0.22f);
                        }
                        else if (hit.attachedRigidbody)
                        {
                            hit.attachedRigidbody.AddForce(hitDirection * (charged ? 7f : 4f), ForceMode2D.Impulse);
                        }
                    }
                }
            }

            if (landedHit)
            {
                CombatFeedback.HitStop(charged ? 0.07f : 0.045f);
                CombatFeedback.Shake(charged ? 0.18f : 0.12f, charged ? 0.13f : 0.08f);
            }
        }

        private void UseMinorPotion()
        {
            if (!inventory)
            {
                inventory = GetComponent<PlayerInventory>();
            }

            if (!inventory || inventory.MinorPotions <= 0)
            {
                InteractionFeedback.Show("No tienes pociones.");
                RetroAudio.Play("locked");
                return;
            }

            int healAmount = Mathf.CeilToInt(health.MaxHealth * 0.25f);
            if (!health.Heal(healAmount))
            {
                InteractionFeedback.Show("Ya tienes la vida llena.");
                return;
            }

            inventory.ConsumeMinorPotion();
            RetroAudio.Play("potion");
            HitBurst.Spawn(transform.position + Vector3.up * 0.35f, new Color(0.32f, 1f, 0.42f), 12);
            InteractionFeedback.Show("Pocion menor usada.");
        }

        public bool TryBlockHit(Vector3 sourcePosition)
        {
            lastBlockWasPerfect = false;
            if (!IsBlocking || stamina < blockStaminaCost)
            {
                if (IsBlocking) TriggerStaminaWarning();
                return false;
            }

            float dx = sourcePosition.x - transform.position.x;
            bool hitFromFront = Mathf.Abs(dx) < 0.12f || Mathf.Sign(dx) == facing;
            if (!hitFromFront) return false;

            bool perfect = parryTimer > 0f;
            if (!perfect)
            {
                stamina = Mathf.Max(0f, stamina - blockStaminaCost);
                if (stamina <= 0f)
                {
                    IsBlocking = false;
                }
            }

            Vector3 blockPoint = transform.position + new Vector3(facing * 0.4f, 0.15f, 0f);
            HitBurst.Spawn(blockPoint, perfect ? new Color(0.42f, 0.94f, 1f) : new Color(0.82f, 0.92f, 1f), perfect ? 20 : 12);
            RetroAudio.Play(perfect ? "parry" : "shield");
            CombatFeedback.Shake(perfect ? 0.16f : 0.09f, perfect ? 0.09f : 0.045f);
            lastBlockWasPerfect = perfect;
            parryTimer = 0f;
            return true;
        }

        public bool ConsumePerfectParrySuccess()
        {
            bool wasPerfect = lastBlockWasPerfect;
            lastBlockWasPerfect = false;
            return wasPerfect;
        }

        private void TriggerStaminaWarning()
        {
            staminaWarningUntil = Time.time + 0.45f;
            RetroAudio.Play("fail");
        }

        public void PlayHurtReaction()
        {
            if (isRolling || health.IsDead) return;

            hurtReactionTimer = 0.16f;
            body.linearVelocity = new Vector2(-facing * 2.1f, Mathf.Max(body.linearVelocity.y, 2.1f));
            HitBurst.Spawn(transform.position + Vector3.up * 0.35f, new Color(1f, 0.34f, 0.24f), 7);
            CombatFeedback.Shake(0.13f, 0.08f);
        }

        public void BeginDeathCollapse(float duration)
        {
            deathCollapseDuration = Mathf.Max(0.2f, duration);
            deathCollapseTimer = deathCollapseDuration;
            isRolling = false;
            rollTimer = 0f;
            attackTimer = 0f;
            chargeTimer = 0f;
            hurtReactionTimer = 0f;
            IsBlocking = false;
            if (shieldRenderer) shieldRenderer.enabled = false;
            if (chargeRenderer) chargeRenderer.enabled = false;
            body.linearVelocity = Vector2.zero;
        }

        private void CreateShieldVisual()
        {
            GameObject shield = new GameObject("Knight Shield");
            shield.transform.SetParent(transform, false);
            shield.transform.localPosition = new Vector2(0.4f, 0.18f);
            shield.transform.localScale = new Vector2(0.72f, 0.82f);

            shieldRenderer = shield.AddComponent<SpriteRenderer>();
            shieldRenderer.sprite = PixelSpriteFactory.KnightShield();
            shieldRenderer.sortingOrder = 12;
            shieldRenderer.enabled = false;
        }

        private void CreateChargeVisual()
        {
            GameObject charge = new GameObject("Charged Attack Glow");
            charge.transform.SetParent(transform, false);
            charge.transform.localPosition = new Vector2(0.62f, 0.42f);
            charge.transform.localScale = new Vector2(0.75f, 0.75f);

            chargeRenderer = charge.AddComponent<SpriteRenderer>();
            chargeRenderer.sprite = PixelSpriteFactory.Create("ChargeBladeGlow", new[]
            {
                "....C....",
                "..CCSCC..",
                ".CCSSSCC.",
                "CCSSWSSCC",
                ".CCSSSCC.",
                "..CCSCC..",
                "....C...."
            }, new System.Collections.Generic.Dictionary<char, Color>
            {
                ['C'] = new Color(0.2f, 0.78f, 1f, 0.42f),
                ['S'] = new Color(0.72f, 0.94f, 1f, 0.82f),
                ['W'] = new Color(1f, 1f, 1f, 0.95f)
            });
            chargeRenderer.sortingOrder = 14;
            chargeRenderer.enabled = false;
        }

        private void UpdateShieldVisual()
        {
            if (!shieldRenderer) return;

            shieldRenderer.flipX = facing < 0;
            bool wantsShield = Input.GetKey(KeyCode.K);
            shieldRenderer.enabled = IsBlocking || (wantsShield && stamina <= blockStaminaCost);
            shieldRenderer.transform.localPosition = new Vector2(facing * 0.4f, 0.18f);
            float pulse = IsBlocking ? 1f + Mathf.Sin(Time.time * 8f) * 0.035f : 1f;
            shieldRenderer.transform.localScale = new Vector2(0.72f * pulse, 0.82f * pulse);
            shieldRenderer.color = stamina <= blockStaminaCost ? new Color(1f, 0.28f, 0.22f, 0.82f) : Color.white;
        }

        private void UpdateChargeVisual()
        {
            if (!chargeRenderer) return;

            bool visible = IsCharging && !IsBlocking && !isRolling;
            chargeRenderer.enabled = visible;
            if (!visible) return;

            chargeRenderer.flipX = facing < 0;
            float readyAmount = Mathf.Clamp01(chargeTimer / chargedAttackThreshold);
            float pulse = 0.7f + readyAmount * 0.25f + Mathf.Sin(Time.time * (IsChargeReady ? 16f : 8f)) * (IsChargeReady ? 0.08f : 0.035f);
            chargeRenderer.transform.localPosition = new Vector2(facing * 0.62f, 0.42f + Mathf.Sin(Time.time * 9f) * 0.025f);
            chargeRenderer.transform.localScale = new Vector2(0.75f * pulse, 0.75f * pulse);
            chargeRenderer.color = IsChargeReady ? new Color(0.52f, 0.94f, 1f, 0.92f) : new Color(0.32f, 0.74f, 1f, 0.42f + readyAmount * 0.32f);
        }

        private void UpdateHurtReaction()
        {
            if (hurtReactionTimer <= 0f)
            {
                transform.localScale = baseScale;
                return;
            }

            float pulse = Mathf.Sin((1f - hurtReactionTimer / 0.16f) * Mathf.PI);
            transform.localScale = new Vector3(baseScale.x * (1f + pulse * 0.04f), baseScale.y * (1f - pulse * 0.05f), baseScale.z);
        }

        private void UpdateDeathCollapse()
        {
            if (deathCollapseTimer <= 0f) return;

            deathCollapseTimer = Mathf.Max(0f, deathCollapseTimer - Time.deltaTime);
            float t = 1f - deathCollapseTimer / deathCollapseDuration;
            float eased = Mathf.SmoothStep(0f, 1f, t);
            float angle = Mathf.Lerp(0f, -88f * facing, eased);
            float squash = Mathf.Sin(eased * Mathf.PI) * 0.08f;
            transform.localRotation = baseRotation * Quaternion.Euler(0f, 0f, angle);
            transform.localScale = new Vector3(baseScale.x * (1f + squash), baseScale.y * (1f - squash * 0.65f), baseScale.z);
        }

        private bool CheckGrounded()
        {
            Bounds bounds = playerCollider.bounds;
            float footY = bounds.min.y - 0.03f;
            float rayDistance = 0.12f;
            float sideOffset = bounds.extents.x * 0.75f;

            Vector2 center = new Vector2(bounds.center.x, footY);
            Vector2 left = center + Vector2.left * sideOffset;
            Vector2 right = center + Vector2.right * sideOffset;

            return Physics2D.Raycast(center, Vector2.down, rayDistance, groundMask)
                || Physics2D.Raycast(left, Vector2.down, rayDistance, groundMask)
                || Physics2D.Raycast(right, Vector2.down, rayDistance, groundMask);
        }

        private void UpdateGravity()
        {
            if (isGrounded && body.linearVelocity.y <= 0f)
            {
                body.gravityScale = baseGravity;
                return;
            }

            if (body.linearVelocity.y < -0.05f)
            {
                body.gravityScale = fallGravity;
            }
            else if (body.linearVelocity.y > 0.05f && !Input.GetKey(KeyCode.Space))
            {
                body.gravityScale = lowJumpGravity;
            }
            else
            {
                body.gravityScale = baseGravity;
            }
        }

        public void RestoreAtBonfire()
        {
            health.HealFull();
            stamina = MaxStamina;
        }

        public void RestoreForRespawn(Vector3 position)
        {
            if (droppedSurface)
            {
                Physics2D.IgnoreCollision(playerCollider, droppedSurface, false);
                droppedSurface = null;
            }

            transform.position = position;
            body.linearVelocity = Vector2.zero;
            isRolling = false;
            rollTimer = 0f;
            attackTimer = 0f;
            chargeTimer = 0f;
            hurtReactionTimer = 0f;
            deathCollapseTimer = 0f;
            transform.localScale = baseScale;
            transform.localRotation = baseRotation;
            stamina = MaxStamina;
            health.ReviveFull();
        }

        private void OnDrawGizmosSelected()
        {
            if (!attackPoint) return;
            Gizmos.color = Color.red;
            Gizmos.DrawWireCube(attackPoint.position + Vector3.right * facing * 0.7f, attackSize);

            if (!playerCollider) return;
            Bounds bounds = playerCollider.bounds;
            Gizmos.color = Color.green;
            Gizmos.DrawLine(new Vector3(bounds.center.x, bounds.min.y - 0.03f, 0f), new Vector3(bounds.center.x, bounds.min.y - 0.15f, 0f));
        }
    }
}
