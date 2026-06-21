using System.Collections.Generic;
using DungeonKnight.Combat;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Interactables
{
    public class TowerAmbushLever : MonoBehaviour, IInteractable
    {
        private readonly List<Health> wave = new();
        private SimpleGate trapGate;
        private GameObject miniBoss;
        private Health miniBossHealth;
        private Transform handlePivot;
        private SpriteRenderer glowRenderer;
        private bool activated;
        private bool bossStarted;

        public string Prompt => activated ? "Palanca activada" : "Activar palanca";

        public void Configure(SimpleGate gate, GameObject boss, Transform handle = null, SpriteRenderer glow = null, params GameObject[] firstWave)
        {
            trapGate = gate;
            miniBoss = boss;
            handlePivot = handle;
            glowRenderer = glow;

            if (trapGate) trapGate.gameObject.SetActive(false);
            if (miniBoss)
            {
                miniBoss.SetActive(false);
                miniBossHealth = miniBoss.GetComponent<Health>();
                if (miniBossHealth) miniBossHealth.Died += OnBossDied;
            }

            foreach (GameObject enemy in firstWave)
            {
                if (!enemy) continue;
                enemy.SetActive(false);
                if (!enemy.TryGetComponent(out Health health)) continue;
                wave.Add(health);
                health.Died += OnWaveEnemyDied;
            }
        }

        public void Interact(GameObject player)
        {
            if (activated)
            {
                InteractionFeedback.Show("La sala ya esta sellada.");
                return;
            }

            activated = true;
            if (handlePivot) handlePivot.localRotation = Quaternion.Euler(0f, 0f, -52f);
            if (glowRenderer) glowRenderer.color = new Color(1f, 0.22f, 0.12f, 0.8f);
            if (trapGate) trapGate.gameObject.SetActive(true);

            foreach (Health health in wave)
            {
                if (health) health.gameObject.SetActive(true);
            }

            RetroAudio.Play("secret");
            InteractionFeedback.Show("La puerta cae. El sotano despierta.", 3f);
            HitBurst.Spawn(transform.position + Vector3.up * 0.5f, new Color(1f, 0.34f, 0.16f), 16);
        }

        private void OnWaveEnemyDied(Health health)
        {
            if (!activated || bossStarted) return;
            for (int i = wave.Count - 1; i >= 0; i--)
            {
                if (!wave[i] || wave[i].IsDead) wave.RemoveAt(i);
            }

            if (wave.Count > 0) return;
            bossStarted = true;
            if (miniBoss) miniBoss.SetActive(true);
            RetroAudio.Play("checkpoint");
            InteractionFeedback.Show("Algo enorme golpea desde la oscuridad.", 3f);
        }

        private void OnBossDied(Health health)
        {
            trapGate?.Open();
            RetroAudio.Play("unlock");
            InteractionFeedback.Show("El guardian cae. La reja se abre.", 3f);
        }

        private void OnDestroy()
        {
            foreach (Health health in wave)
            {
                if (health) health.Died -= OnWaveEnemyDied;
            }

            if (miniBossHealth) miniBossHealth.Died -= OnBossDied;
        }
    }
}
