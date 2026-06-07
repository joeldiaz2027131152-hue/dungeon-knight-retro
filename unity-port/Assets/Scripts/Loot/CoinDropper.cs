using DungeonKnight.Combat;
using UnityEngine;

namespace DungeonKnight.Loot
{
    [RequireComponent(typeof(Health))]
    public class CoinDropper : MonoBehaviour
    {
        [SerializeField] private int coins = 3;

        public void Configure(int amount)
        {
            coins = Mathf.Max(0, amount);
        }

        private void Awake()
        {
            GetComponent<Health>().Died += OnDied;
        }

        private void OnDied(Health health)
        {
            LootSpawner.SpawnCoins(transform.position + Vector3.up * 0.35f, coins);
        }
    }
}
