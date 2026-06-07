using DungeonKnight.Combat;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Level
{
    public class DamageHazard : MonoBehaviour
    {
        [SerializeField] private int damage = 12;
        [SerializeField] private float cooldown = 0.7f;

        private float nextDamageTime;

        public void Configure(int amount, float delay)
        {
            damage = amount;
            cooldown = delay;
        }

        private void OnTriggerStay2D(Collider2D other)
        {
            if (!other.CompareTag("Player")) return;
            if (Time.time < nextDamageTime) return;

            if (other.TryGetComponent(out Health health) && health.TakeDamage(damage))
            {
                nextDamageTime = Time.time + cooldown;
                HitBurst.Spawn(other.transform.position, new Color(0.78f, 0.9f, 1f), 8);
            }
        }
    }
}
