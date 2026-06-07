using System.Collections;
using DungeonKnight.Level;
using UnityEngine;

namespace DungeonKnight
{
    public class CombatFeedback : MonoBehaviour
    {
        private static CombatFeedback instance;
        private Coroutine hitStopRoutine;

        public static void HitStop(float seconds)
        {
            if (seconds <= 0f) return;
            Instance().StartHitStop(seconds);
        }

        public static void Shake(float seconds, float strength)
        {
            CameraFollow2D cameraFollow = Camera.main ? Camera.main.GetComponent<CameraFollow2D>() : null;
            if (cameraFollow)
            {
                cameraFollow.Shake(seconds, strength);
            }
        }

        private static CombatFeedback Instance()
        {
            if (instance) return instance;

            instance = new GameObject("Combat Feedback").AddComponent<CombatFeedback>();
            DontDestroyOnLoad(instance.gameObject);
            return instance;
        }

        private void StartHitStop(float seconds)
        {
            if (hitStopRoutine != null) StopCoroutine(hitStopRoutine);
            hitStopRoutine = StartCoroutine(HitStopRoutine(seconds));
        }

        private IEnumerator HitStopRoutine(float seconds)
        {
            float previousScale = Time.timeScale;
            Time.timeScale = 0.08f;
            yield return new WaitForSecondsRealtime(seconds);
            Time.timeScale = previousScale;
            hitStopRoutine = null;
        }
    }
}
