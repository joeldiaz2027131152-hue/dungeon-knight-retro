using UnityEngine;

namespace DungeonKnight.Player
{
    public class PlayerInventory : MonoBehaviour
    {
        public int Coins { get; private set; }
        public int MinorPotions { get; private set; } = 1;
        public int MaxMinorPotions { get; private set; } = 3;
        public bool HasGateKey { get; private set; }

        public void AddCoins(int amount)
        {
            Coins += Mathf.Max(0, amount);
            Debug.Log($"Coins: {Coins}");
        }

        public void UnlockLateGamePotionBag()
        {
            MaxMinorPotions = 5;
        }

        public bool AddMinorPotion()
        {
            if (MinorPotions >= MaxMinorPotions) return false;
            MinorPotions++;
            return true;
        }

        public bool ConsumeMinorPotion()
        {
            if (MinorPotions <= 0) return false;
            MinorPotions--;
            return true;
        }

        public void AddGateKey()
        {
            HasGateKey = true;
            Debug.Log("Gate key collected.");
        }
    }
}
