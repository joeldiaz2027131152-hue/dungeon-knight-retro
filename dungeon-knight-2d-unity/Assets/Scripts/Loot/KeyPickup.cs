using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Loot
{
    [RequireComponent(typeof(Collider2D), typeof(Rigidbody2D))]
    public class KeyPickup : MonoBehaviour
    {
        private float life = 45f;

        public void Configure(Vector2 impulse)
        {
            GetComponent<Rigidbody2D>().AddForce(impulse, ForceMode2D.Impulse);
        }

        private void Update()
        {
            life -= Time.deltaTime;
            transform.Rotate(0f, 0f, 90f * Time.deltaTime);
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
            if (!other.TryGetComponent(out PlayerInventory inventory)) return;

            inventory.AddGateKey();
            RetroAudio.Play("key");
            HitBurst.Spawn(transform.position, new Color(1f, 0.84f, 0.28f), 10);
            InteractionFeedback.Show("Llave del porton obtenida.");
            Destroy(gameObject);
        }
    }
}
