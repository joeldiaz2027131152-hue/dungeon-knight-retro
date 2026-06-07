using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Loot
{
    [RequireComponent(typeof(Collider2D), typeof(Rigidbody2D))]
    public class CoinPickup : MonoBehaviour
    {
        private int value = 1;
        private float life = 12f;

        public void Configure(int amount, Vector2 impulse)
        {
            value = Mathf.Max(1, amount);
            GetComponent<Rigidbody2D>().AddForce(impulse, ForceMode2D.Impulse);
        }

        private void Update()
        {
            life -= Time.deltaTime;
            transform.Rotate(0f, 0f, 160f * Time.deltaTime);
            if (life <= 0f) Destroy(gameObject);
        }

        private void OnCollisionEnter2D(Collision2D collision)
        {
            TryCollect(collision.gameObject);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            TryCollect(other.gameObject);
        }

        private void TryCollect(GameObject other)
        {
            if (!other.CompareTag("Player")) return;
            if (other.TryGetComponent(out PlayerInventory inventory))
            {
                inventory.AddCoins(value);
                RetroAudio.Play("coin");
                HitBurst.Spawn(transform.position, new Color(1f, 0.9f, 0.3f), 5);
                Destroy(gameObject);
            }
        }
    }
}
