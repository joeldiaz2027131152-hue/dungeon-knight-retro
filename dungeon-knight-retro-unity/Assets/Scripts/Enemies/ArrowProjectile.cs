using DungeonKnight.Combat;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Enemies
{
    [RequireComponent(typeof(Collider2D), typeof(Rigidbody2D))]
    public class ArrowProjectile : MonoBehaviour
    {
        private int damage = 8;
        private Vector2 direction = Vector2.right;
        private float life = 5f;

        public void Configure(Vector2 shootDirection, int amount)
        {
            direction = shootDirection.normalized;
            damage = amount;
            if (TryGetComponent(out Rigidbody2D body))
            {
                body.linearVelocity = direction * 6.2f;
            }
        }

        private void Update()
        {
            life -= Time.deltaTime;
            transform.rotation = Quaternion.Euler(0f, 0f, Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg);
            if (life <= 0f) Destroy(gameObject);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (other.CompareTag("Enemy")) return;

            if (other.CompareTag("Player"))
            {
                if (other.TryGetComponent(out PlayerController2D controller) && controller.TryBlockHit(transform.position))
                {
                    if (controller.ConsumePerfectParrySuccess())
                    {
                        HitBurst.Spawn(transform.position, new Color(0.42f, 0.94f, 1f), 12);
                    }

                    Destroy(gameObject);
                    return;
                }

                if (other.TryGetComponent(out Health health) && health.TakeDamage(damage))
                {
                    HitBurst.Spawn(transform.position, new Color(1f, 0.48f, 0.28f), 7);
                }
            }

            Destroy(gameObject);
        }
    }
}
