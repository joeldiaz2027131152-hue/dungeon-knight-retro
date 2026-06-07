using System.Collections.Generic;
using UnityEngine;

namespace DungeonKnight
{
    public class RetroAudio : MonoBehaviour
    {
        private static RetroAudio instance;
        private readonly Dictionary<string, AudioClip> clips = new();
        private AudioSource source;

        public static void Play(string id)
        {
            if (!instance)
            {
                instance = new GameObject("Retro Audio").AddComponent<RetroAudio>();
                DontDestroyOnLoad(instance.gameObject);
            }

            instance.PlayInternal(id);
        }

        private void Awake()
        {
            source = gameObject.AddComponent<AudioSource>();
            source.playOnAwake = false;
        }

        private void PlayInternal(string id)
        {
            AudioClip clip = GetClip(id);
            if (clip)
            {
                source.PlayOneShot(clip, 0.45f);
            }
        }

        private AudioClip GetClip(string id)
        {
            if (clips.TryGetValue(id, out AudioClip clip)) return clip;

            clip = id switch
            {
                "jump" => Tone(id, 360f, 640f, 0.12f, 0.18f),
                "step" => Noise(id, 0.035f, 0.08f),
                "roll" => Noise(id, 0.11f, 0.16f),
                "slash" => Noise(id, 0.08f, 0.35f),
                "heavySlash" => Noise(id, 0.16f, 0.48f),
                "charge" => Tone(id, 420f, 980f, 0.22f, 0.18f),
                "bossPulse" => Tone(id, 160f, 460f, 0.36f, 0.22f),
                "hit" => Tone(id, 180f, 85f, 0.13f, 0.26f),
                "shield" => Tone(id, 520f, 180f, 0.12f, 0.24f),
                "parry" => Tone(id, 900f, 1380f, 0.14f, 0.24f),
                "fail" => Tone(id, 150f, 90f, 0.12f, 0.18f),
                "arrow" => Noise(id, 0.06f, 0.18f),
                "locked" => Tone(id, 120f, 80f, 0.18f, 0.24f),
                "bones" => Noise(id, 0.18f, 0.28f),
                "coin" => Tone(id, 740f, 1180f, 0.12f, 0.2f),
                "key" => Tone(id, 520f, 1280f, 0.26f, 0.22f),
                "secret" => Tone(id, 260f, 980f, 0.42f, 0.22f),
                "potion" => Tone(id, 440f, 920f, 0.28f, 0.2f),
                "crate" => Noise(id, 0.16f, 0.34f),
                "chest" => Tone(id, 320f, 820f, 0.22f, 0.22f),
                "checkpoint" => Tone(id, 190f, 680f, 0.5f, 0.2f),
                "bonfire" => Tone(id, 220f, 420f, 0.28f, 0.22f),
                "door" => Tone(id, 180f, 520f, 0.45f, 0.25f),
                "unlock" => Tone(id, 360f, 1120f, 0.42f, 0.24f),
                "death" => Tone(id, 240f, 70f, 0.55f, 0.28f),
                _ => Tone(id, 440f, 440f, 0.1f, 0.2f)
            };
            clips[id] = clip;
            return clip;
        }

        private static AudioClip Tone(string name, float startHz, float endHz, float seconds, float gain)
        {
            const int sampleRate = 44100;
            int samples = Mathf.CeilToInt(sampleRate * seconds);
            float[] data = new float[samples];

            for (int i = 0; i < samples; i++)
            {
                float t = i / (float)samples;
                float hz = Mathf.Lerp(startHz, endHz, t);
                float env = Mathf.Sin(t * Mathf.PI) * (1f - t * 0.35f);
                data[i] = Mathf.Sin(2f * Mathf.PI * hz * i / sampleRate) * env * gain;
            }

            AudioClip clip = AudioClip.Create(name, samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }

        private static AudioClip Noise(string name, float seconds, float gain)
        {
            const int sampleRate = 44100;
            int samples = Mathf.CeilToInt(sampleRate * seconds);
            float[] data = new float[samples];

            for (int i = 0; i < samples; i++)
            {
                float t = i / (float)samples;
                data[i] = Random.Range(-1f, 1f) * (1f - t) * gain;
            }

            AudioClip clip = AudioClip.Create(name, samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
