using DungeonKnight.Combat;
using UnityEngine;

namespace DungeonKnight.Loot
{
    [RequireComponent(typeof(Health))]
    public class KeyDropper : MonoBehaviour
    {
        private void Awake()
        {
            GetComponent<Health>().Died += OnDied;
        }

        private void OnDied(Health health)
        {
            LootSpawner.SpawnGateKey(transform.position);
        }
    }
}
