using System.Collections.Generic;
using DungeonKnight.Combat;
using DungeonKnight.Interactables;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Level
{
    public class ArenaEncounter : MonoBehaviour
    {
        private readonly List<Health> enemies = new();
        private SimpleGate[] gates;
        private bool started;

        public void Configure(SimpleGate[] arenaGates, params GameObject[] trackedEnemies)
        {
            gates = arenaGates;
            foreach (SimpleGate gate in gates)
            {
                if (gate) gate.gameObject.SetActive(false);
            }

            enemies.Clear();
            foreach (GameObject enemy in trackedEnemies)
            {
                if (!enemy || !enemy.TryGetComponent(out Health health)) continue;
                enemies.Add(health);
                health.Died += OnEnemyDied;
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (started || !other.CompareTag("Player")) return;
            started = true;
            foreach (SimpleGate gate in gates)
            {
                if (gate) gate.gameObject.SetActive(true);
            }

            RetroAudio.Play("checkpoint");
            InteractionFeedback.Show("La camara se sella. Sobrevive al asalto.", 2.8f);
            HitBurst.Spawn(transform.position + Vector3.up * 0.6f, new Color(0.78f, 0.88f, 1f), 14);
        }

        private void OnEnemyDied(Health health)
        {
            if (!started) return;
            for (int i = enemies.Count - 1; i >= 0; i--)
            {
                if (!enemies[i] || enemies[i].IsDead) enemies.RemoveAt(i);
            }

            if (enemies.Count > 0) return;

            foreach (SimpleGate gate in gates)
            {
                gate?.Open();
            }

            RetroAudio.Play("unlock");
            InteractionFeedback.Show("El asalto termina. Las rejas ceden.", 2.8f);
        }

        private void OnDestroy()
        {
            foreach (Health enemy in enemies)
            {
                if (enemy) enemy.Died -= OnEnemyDied;
            }
        }
    }
}
