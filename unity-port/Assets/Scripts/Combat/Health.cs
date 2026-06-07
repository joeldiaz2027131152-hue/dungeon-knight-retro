using System;
using System.Collections;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Combat
{
    public class Health : MonoBehaviour
    {
        [SerializeField] private int maxHealth = 100;
        [SerializeField] private bool destroyOnDeath = true;

        public int MaxHealth => maxHealth;
        public int CurrentHealth { get; private set; }
        public bool IsDead => CurrentHealth <= 0;

        public event Action<Health> Died;
        public event Action<int, int> HealthChanged;

        private SpriteRenderer spriteRenderer;
        private Color originalColor;
        private Coroutine flashRoutine;
        private bool deathStarted;

        private void Awake()
        {
            CurrentHealth = maxHealth;
            spriteRenderer = GetComponent<SpriteRenderer>();
            if (spriteRenderer)
            {
                originalColor = spriteRenderer.color;
            }
        }

        public void SetMaxHealth(int value, bool fill = true)
        {
            maxHealth = Mathf.Max(1, value);
            CurrentHealth = fill ? maxHealth : Mathf.Min(CurrentHealth, maxHealth);
            HealthChanged?.Invoke(CurrentHealth, maxHealth);
        }

        public void SetDestroyOnDeath(bool value)
        {
            destroyOnDeath = value;
        }

        public bool TakeDamage(int amount)
        {
            if (IsDead || deathStarted || amount <= 0) return false;
            if (TryGetComponent(out PlayerController2D player) && player.IsInvulnerable) return false;

            CurrentHealth = Mathf.Max(0, CurrentHealth - amount);
            HealthChanged?.Invoke(CurrentHealth, maxHealth);
            DamagePopup.Spawn(transform.position + Vector3.up * 0.75f, amount, new Color(1f, 0.78f, 0.24f));
            RetroAudio.Play("hit");
            if (TryGetComponent(out PlayerController2D damagedPlayer))
            {
                damagedPlayer.PlayHurtReaction();
            }

            if (spriteRenderer)
            {
                if (flashRoutine != null) StopCoroutine(flashRoutine);
                flashRoutine = StartCoroutine(Flash());
            }

            if (CurrentHealth <= 0)
            {
                deathStarted = true;
                HitBurst.Spawn(transform.position, new Color(1f, 0.82f, 0.35f), 14);
                Died?.Invoke(this);
                if (destroyOnDeath) StartCoroutine(DelayedDestroy());
            }

            return true;
        }

        public void HealFull()
        {
            deathStarted = false;
            CurrentHealth = maxHealth;
            HealthChanged?.Invoke(CurrentHealth, maxHealth);
        }

        public bool Heal(int amount)
        {
            if (IsDead || amount <= 0 || CurrentHealth >= maxHealth) return false;

            CurrentHealth = Mathf.Min(maxHealth, CurrentHealth + amount);
            HealthChanged?.Invoke(CurrentHealth, maxHealth);
            DamagePopup.Spawn(transform.position + Vector3.up * 0.85f, amount, new Color(0.32f, 1f, 0.42f));
            return true;
        }

        public void ReviveFull()
        {
            deathStarted = false;
            CurrentHealth = maxHealth;
            HealthChanged?.Invoke(CurrentHealth, maxHealth);

            if (spriteRenderer)
            {
                spriteRenderer.color = originalColor;
            }
        }

        private IEnumerator Flash()
        {
            spriteRenderer.color = Color.white;
            yield return new WaitForSeconds(0.06f);
            spriteRenderer.color = new Color(1f, 0.45f, 0.35f);
            yield return new WaitForSeconds(0.06f);
            spriteRenderer.color = originalColor;
            flashRoutine = null;
        }

        private IEnumerator DelayedDestroy()
        {
            if (spriteRenderer) spriteRenderer.enabled = false;
            foreach (Collider2D collider2d in GetComponents<Collider2D>())
            {
                collider2d.enabled = false;
            }

            if (TryGetComponent(out Rigidbody2D body))
            {
                body.linearVelocity = Vector2.zero;
                body.simulated = false;
            }

            yield return new WaitForSeconds(0.18f);
            Destroy(gameObject);
        }
    }
}
