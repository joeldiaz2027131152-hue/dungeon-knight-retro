using DungeonKnight.Combat;
using UnityEngine;

namespace DungeonKnight.Loot
{
    [RequireComponent(typeof(Health))]
    public class ShieldDropper : MonoBehaviour
    {
        private void Awake()
        {
            GetComponent<Health>().Died += OnDied;
        }

        private void OnDied(Health health)
        {
            SpawnShield(transform.position + Vector3.up * 0.35f);
        }

        private static void SpawnShield(Vector3 position)
        {
            GameObject shield = new GameObject("Tower Shield Pickup");
            shield.transform.position = position;
            shield.transform.localScale = new Vector3(1.22f, 1.22f, 1f);

            SpriteRenderer renderer = shield.AddComponent<SpriteRenderer>();
            renderer.sprite = PixelSpriteFactory.KnightShield();
            renderer.color = new Color(1f, 0.9f, 0.52f);
            renderer.sortingOrder = 8;

            BoxCollider2D collider = shield.AddComponent<BoxCollider2D>();
            collider.size = renderer.sprite.bounds.size;
            collider.isTrigger = true;

            int interactableLayer = LayerMask.NameToLayer("Interactable");
            if (interactableLayer >= 0) shield.layer = interactableLayer;
            shield.AddComponent<ShieldPickup>();
        }
    }
}
