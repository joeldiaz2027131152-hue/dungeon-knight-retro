using System.Collections;
using DungeonKnight.Combat;
using DungeonKnight.Player;
using DungeonKnight.UI;
using UnityEngine;

namespace DungeonKnight.Level
{
    public class GameSession : MonoBehaviour
    {
        public static GameSession Instance { get; private set; }

        private PlayerController2D playerController;
        private Health playerHealth;
        private Vector3 checkpoint;
        private bool respawning;
        private bool paused;
        private bool waitingToStart;
        private bool levelComplete;
        private float introUntil;
        private float transitionStart;
        private float transitionUntil;
        private float transitionDuration = 3.2f;
        private string transitionMessage;
        private string currentAreaTitle;
        private string respawnMessage = "Has caido\nLa hoguera te reclama...";
        private float respawnOverlayStart;
        private float respawnOverlayUntil;
        private int currentLevel = 1;
        private const float FallDeathY = -5.6f;
        private const float RespawnOverlayDuration = 3.35f;

        public void BindPlayer(GameObject player, Vector3 startCheckpoint)
        {
            Instance = this;
            playerController = player.GetComponent<PlayerController2D>();
            playerHealth = player.GetComponent<Health>();
            checkpoint = startCheckpoint;
            playerHealth.SetDestroyOnDeath(false);
            playerHealth.Died += OnPlayerDied;
            waitingToStart = true;
            Time.timeScale = 0f;
            playerController.enabled = false;
            introUntil = 0f;
            currentAreaTitle = "Mundo 1-1\nEl Pasillo Gotico";
            transitionMessage = currentAreaTitle;
        }

        public void SetCheckpoint(Vector3 position)
        {
            checkpoint = position;
        }

        public void CompleteLevel()
        {
            if (levelComplete) return;
            StartCoroutine(LevelExit());
        }

        public void ReturnToWorldOneOne()
        {
            if (levelComplete || currentLevel != 2) return;
            StartCoroutine(LevelReturn());
        }

        public void ReturnToWorldOneTwo()
        {
            if (levelComplete || currentLevel != 3) return;
            StartCoroutine(LevelReturnToWorldOneTwo());
        }

        private void Update()
        {
            if (waitingToStart)
            {
                if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
                {
                    waitingToStart = false;
                    Time.timeScale = 1f;
                    introUntil = Time.time + 2.2f;
                    if (playerController) playerController.enabled = true;
                    RetroAudio.Play("checkpoint");
                }

                return;
            }

            if (Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.P))
            {
                paused = !paused;
                Time.timeScale = paused ? 0f : 1f;
            }

            if (paused && Input.GetKeyDown(KeyCode.R))
            {
                Time.timeScale = 1f;
                paused = false;
                playerController.RestoreForRespawn(checkpoint);
            }

            CheckFallDeath();
        }

        private void OnGUI()
        {
            if (waitingToStart)
            {
                DrawStartScreen();
                return;
            }

            if (paused)
            {
                DrawPauseMenu();
            }

            if (Time.time < introUntil)
            {
                float alpha = Mathf.Clamp01((introUntil - Time.time) / 1.2f);
                DrawOverlay(alpha, currentAreaTitle);
            }

            if (Time.time < transitionUntil)
            {
                float t = Mathf.Clamp01((Time.time - transitionStart) / Mathf.Max(0.01f, transitionDuration));
                float alpha = Mathf.Clamp01(t * 2.4f);
                DrawOverlay(alpha, transitionMessage);
            }

            if (Time.time < respawnOverlayUntil)
            {
                float t = Mathf.Clamp01((Time.time - respawnOverlayStart) / RespawnOverlayDuration);
                float alpha = t < 0.55f ? Mathf.Clamp01(t / 0.55f) : t < 0.86f ? 1f : Mathf.Clamp01((1f - t) / 0.14f);
                DrawOverlay(alpha, respawnMessage);
            }
        }

        private void CheckFallDeath()
        {
            if (respawning || levelComplete || paused || !playerController) return;
            if (playerController.transform.position.y > GetFallDeathY()) return;

            StartCoroutine(FallRespawn());
        }

        private float GetFallDeathY()
        {
            return currentLevel == 3 ? -15.5f : FallDeathY;
        }

        private void OnPlayerDied(Health health)
        {
            if (respawning) return;
            StartCoroutine(Respawn());
        }

        private IEnumerator Respawn()
        {
            respawning = true;
            respawnMessage = "Has caido\nLa hoguera te reclama...";
            RetroAudio.Play("death");
            respawnOverlayStart = Time.time;
            respawnOverlayUntil = Time.time + RespawnOverlayDuration;
            if (playerController) playerController.BeginDeathCollapse(1.15f);

            InteractionFeedback.Show("Has caido. Regresando a la hoguera...", 3f);
            yield return new WaitForSeconds(2.65f);
            if (playerController) playerController.enabled = false;
            playerController.RestoreForRespawn(checkpoint);
            HitBurst.Spawn(checkpoint + Vector3.up * 0.2f, new Color(1f, 0.58f, 0.16f), 18);
            yield return new WaitForSeconds(0.55f);
            if (playerController) playerController.enabled = true;
            respawning = false;
        }

        private IEnumerator FallRespawn()
        {
            respawning = true;
            respawnMessage = "Perdiste el camino\nLa hoguera te reclama...";
            RetroAudio.Play("death");
            respawnOverlayStart = Time.time;
            respawnOverlayUntil = Time.time + RespawnOverlayDuration;
            InteractionFeedback.Show("Perdiste el suelo. Regresando a la hoguera...", 3f);

            if (playerController && playerController.TryGetComponent(out Rigidbody2D body))
            {
                body.linearVelocity = Vector2.zero;
            }
            if (playerController) playerController.enabled = false;

            yield return new WaitForSeconds(2.05f);
            playerController.RestoreForRespawn(checkpoint);
            HitBurst.Spawn(checkpoint + Vector3.up * 0.2f, new Color(1f, 0.58f, 0.16f), 18);
            yield return new WaitForSeconds(0.55f);
            if (playerController) playerController.enabled = true;
            respawning = false;
        }

        private IEnumerator LevelExit()
        {
            levelComplete = true;
            bool enteringSecondLevel = currentLevel == 1;
            bool enteringThirdLevel = currentLevel == 2;
            transitionMessage = enteringSecondLevel
                ? "Nivel 1-1 completado\nEl porton se abre hacia las escaleras..."
                : enteringThirdLevel
                    ? "Nivel 1-2 completado\nLa torre despierta sobre la catedral..."
                    : "Nivel 1-3 completado\nLa cima aun guarda silencio.";
            transitionDuration = enteringSecondLevel ? 3.4f : enteringThirdLevel ? 3.2f : 2.8f;
            transitionStart = Time.time;
            transitionUntil = Time.time + transitionDuration;
            RetroAudio.Play("door");
            InteractionFeedback.Show(enteringSecondLevel ? "La puerta se abre hacia el proximo tramo..." : enteringThirdLevel ? "Subes hacia la torre de guardia." : "Demo del 1-3 completada.", 3f);
            if (playerController) playerController.enabled = false;
            if (playerController && playerController.TryGetComponent(out Rigidbody2D body))
            {
                body.linearVelocity = Vector2.zero;
            }

            yield return new WaitForSeconds(transitionDuration);

            if (enteringSecondLevel)
            {
                WorldOneOneBootstrap.BuildWorldOneTwo();
                currentLevel = 2;
                currentAreaTitle = "Mundo 1-2\nLas Escaleras de la Catedral";
                checkpoint = WorldOneOneBootstrap.WorldOneTwoSpawn;
                if (playerController)
                {
                    playerController.RestoreForRespawn(checkpoint);
                }

                CameraFollow2D follow = Camera.main ? Camera.main.GetComponent<CameraFollow2D>() : null;
                if (follow)
                {
                    float offset = WorldOneOneBootstrap.WorldOneTwoOffset;
                    follow.Configure(new Vector2(0.75f, 1.25f), 1.45f, 0.14f, new Vector2(offset - 7.2f, 1.1f), new Vector2(offset + 98.6f, 6.85f));
                    follow.PlayIntro(new Vector3(offset - 6.4f, 3.45f, -10f), 1.05f);
                }

                introUntil = Time.time + 2.4f;
                InteractionFeedback.Show("Mundo 1-2: sube por las escaleras de la catedral.", 3.2f);
            }
            else if (enteringThirdLevel)
            {
                WorldOneOneBootstrap.BuildWorldOneThree();
                currentLevel = 3;
                currentAreaTitle = "Mundo 1-3\nLa Torre del Vigia";
                checkpoint = WorldOneOneBootstrap.WorldOneThreeSpawn;
                if (playerController)
                {
                    playerController.RestoreForRespawn(checkpoint);
                }

                CameraFollow2D follow = Camera.main ? Camera.main.GetComponent<CameraFollow2D>() : null;
                if (follow)
                {
                    float offset = WorldOneOneBootstrap.WorldOneThreeOffset;
                    follow.Configure(new Vector2(0.75f, 1.35f), 1.45f, 0.14f, new Vector2(offset - 5.2f, -12.7f), new Vector2(offset + 60.8f, 7.85f));
                    follow.PlayIntro(new Vector3(offset - 6.4f, 3.2f, -10f), 1.05f);
                }

                introUntil = Time.time + 2.4f;
                InteractionFeedback.Show("Mundo 1-3: la torre sube y baja mas alla de la camara.", 3.2f);
            }

            if (playerController) playerController.enabled = true;
            levelComplete = false;
        }

        private IEnumerator LevelReturn()
        {
            levelComplete = true;
            transitionMessage = "Mundo 1-2\nVolviendo al Pasillo Gotico...";
            transitionDuration = 1.8f;
            transitionStart = Time.time;
            transitionUntil = Time.time + transitionDuration;
            RetroAudio.Play("door");
            InteractionFeedback.Show("Regresas por el mismo porton.", 2f);
            if (playerController) playerController.enabled = false;
            if (playerController && playerController.TryGetComponent(out Rigidbody2D body))
            {
                body.linearVelocity = Vector2.zero;
            }

            yield return new WaitForSeconds(transitionDuration);

            currentLevel = 1;
            currentAreaTitle = "Mundo 1-1\nEl Pasillo Gotico";
            checkpoint = WorldOneOneBootstrap.WorldOneOneReturnSpawn;
            if (playerController)
            {
                playerController.RestoreForRespawn(checkpoint);
            }

            CameraFollow2D follow = Camera.main ? Camera.main.GetComponent<CameraFollow2D>() : null;
            if (follow)
            {
                follow.Configure(new Vector2(0.75f, 1.25f), 1.45f, 0.14f, new Vector2(-0.8f, 1.1f), new Vector2(40.5f, 4.45f));
                follow.PlayIntro(new Vector3(36.8f, 3.1f, -10f), 0.85f);
            }

            introUntil = Time.time + 1.8f;
            if (playerController) playerController.enabled = true;
            levelComplete = false;
        }

        private IEnumerator LevelReturnToWorldOneTwo()
        {
            levelComplete = true;
            transitionMessage = "Mundo 1-3\nBajando de vuelta al 1-2...";
            transitionDuration = 1.8f;
            transitionStart = Time.time;
            transitionUntil = Time.time + transitionDuration;
            RetroAudio.Play("door");
            InteractionFeedback.Show("Regresas al tramo anterior de la catedral.", 2f);
            if (playerController) playerController.enabled = false;
            if (playerController && playerController.TryGetComponent(out Rigidbody2D body))
            {
                body.linearVelocity = Vector2.zero;
            }

            yield return new WaitForSeconds(transitionDuration);

            currentLevel = 2;
            currentAreaTitle = "Mundo 1-2\nLas Escaleras de la Catedral";
            checkpoint = new Vector3(WorldOneOneBootstrap.WorldOneTwoOffset + 96.2f, 2.25f, 0f);
            if (playerController)
            {
                playerController.RestoreForRespawn(checkpoint);
            }

            CameraFollow2D follow = Camera.main ? Camera.main.GetComponent<CameraFollow2D>() : null;
            if (follow)
            {
                float offset = WorldOneOneBootstrap.WorldOneTwoOffset;
                follow.Configure(new Vector2(0.75f, 1.25f), 1.45f, 0.14f, new Vector2(offset - 7.2f, 1.1f), new Vector2(offset + 98.6f, 6.85f));
                follow.PlayIntro(new Vector3(offset + 94.8f, 4.35f, -10f), 0.85f);
            }

            introUntil = Time.time + 1.8f;
            if (playerController) playerController.enabled = true;
            levelComplete = false;
        }

        private static void DrawOverlay(float alpha, string text)
        {
            GUI.color = new Color(0f, 0f, 0f, 0.78f * Mathf.Clamp01(alpha));
            GUI.DrawTexture(new Rect(0, 0, Screen.width, Screen.height), Texture2D.whiteTexture);
            GUI.color = Color.white;
            GUIStyle style = new GUIStyle(GUI.skin.label)
            {
                fontSize = 34,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = Color.white },
                fontStyle = FontStyle.Bold
            };
            GUI.Label(new Rect(0, Screen.height * 0.39f, Screen.width, 120), text, style);
        }

        private static void DrawStartScreen()
        {
            DrawRect(new Rect(0, 0, Screen.width, Screen.height), new Color(0.015f, 0.015f, 0.026f, 0.96f));
            DrawRect(new Rect(0, Screen.height * 0.62f, Screen.width, 2f), new Color(0.72f, 0.54f, 0.24f, 0.48f));

            GUIStyle title = new GUIStyle(GUI.skin.label)
            {
                fontSize = 42,
                alignment = TextAnchor.MiddleCenter,
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(1f, 0.86f, 0.46f) }
            };
            GUIStyle subtitle = new GUIStyle(title)
            {
                fontSize = 18,
                fontStyle = FontStyle.Normal,
                normal = { textColor = new Color(0.82f, 0.86f, 0.9f) }
            };
            GUIStyle prompt = new GUIStyle(title)
            {
                fontSize = 20,
                normal = { textColor = new Color(0.48f, 0.86f, 1f) }
            };

            GUI.Label(new Rect(0, Screen.height * 0.28f, Screen.width, 64f), "Dungeon Knight", title);
            GUI.Label(new Rect(0, Screen.height * 0.39f, Screen.width, 34f), "El Pasillo Gotico", subtitle);
            GUI.Label(new Rect(0, Screen.height * 0.54f, Screen.width, 38f), "Presiona Enter para comenzar", prompt);
        }

        private static void DrawPauseMenu()
        {
            DrawRect(new Rect(0, 0, Screen.width, Screen.height), new Color(0f, 0f, 0f, 0.72f));

            float width = Mathf.Min(540f, Screen.width - 48f);
            Rect panel = new Rect((Screen.width - width) * 0.5f, Screen.height * 0.25f, width, 252f);
            DrawSoftBox(panel, new Color(0.035f, 0.035f, 0.055f, 0.96f), new Color(0.74f, 0.58f, 0.28f, 0.92f));
            DrawRect(new Rect(panel.x + 28f, panel.y + 54f, panel.width - 56f, 2f), new Color(1f, 0.78f, 0.36f, 0.35f));

            GUIStyle title = new GUIStyle(GUI.skin.label)
            {
                fontSize = 32,
                alignment = TextAnchor.MiddleCenter,
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(1f, 0.9f, 0.62f) }
            };
            GUIStyle row = new GUIStyle(GUI.skin.label)
            {
                fontSize = 17,
                alignment = TextAnchor.MiddleLeft,
                wordWrap = false,
                clipping = TextClipping.Clip,
                normal = { textColor = new Color(0.9f, 0.9f, 0.86f) }
            };
            GUIStyle key = new GUIStyle(row)
            {
                fontStyle = FontStyle.Bold,
                normal = { textColor = new Color(0.45f, 0.86f, 1f) }
            };

            GUI.Label(new Rect(panel.x, panel.y + 16f, panel.width, 40f), "Pausa", title);
            DrawPauseRow(panel, 82f, "P / Esc", "volver al juego", key, row);
            DrawPauseRow(panel, 130f, "R", "reaparecer en la hoguera", key, row);
            DrawPauseRow(panel, 178f, "K", "probar bloqueo con escudo", key, row);
        }

        private static void DrawPauseRow(Rect panel, float offsetY, string keyText, string description, GUIStyle keyStyle, GUIStyle rowStyle)
        {
            Rect rowRect = new Rect(panel.x + 34f, panel.y + offsetY, panel.width - 68f, 36f);
            DrawRect(rowRect, new Color(1f, 1f, 1f, 0.035f));
            GUI.Label(new Rect(rowRect.x + 14f, rowRect.y + 4f, 90f, rowRect.height), keyText, keyStyle);
            GUI.Label(new Rect(rowRect.x + 112f, rowRect.y + 4f, rowRect.width - 124f, rowRect.height), description, rowStyle);
        }

        private static void DrawSoftBox(Rect rect, Color fill, Color border)
        {
            DrawRect(rect, fill);
            DrawRect(new Rect(rect.x, rect.y, rect.width, 2f), border);
            DrawRect(new Rect(rect.x, rect.yMax - 2f, rect.width, 2f), new Color(border.r * 0.55f, border.g * 0.55f, border.b * 0.55f, border.a));
            DrawRect(new Rect(rect.x, rect.y, 2f, rect.height), border);
            DrawRect(new Rect(rect.xMax - 2f, rect.y, 2f, rect.height), new Color(border.r * 0.55f, border.g * 0.55f, border.b * 0.55f, border.a));
        }

        private static void DrawRect(Rect rect, Color color)
        {
            Color previous = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(rect, Texture2D.whiteTexture);
            GUI.color = previous;
        }
    }
}
