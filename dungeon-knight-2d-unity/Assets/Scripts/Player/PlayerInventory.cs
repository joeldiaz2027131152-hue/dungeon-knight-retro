using UnityEngine;

namespace DungeonKnight.Player
{
    public enum ShieldKind
    {
        Steel,
        Tower
    }

    public class PlayerInventory : MonoBehaviour
    {
        private readonly bool[] shieldSlots = { true, false, false, false, false, false };
        private readonly ShieldKind[] shieldKinds =
        {
            ShieldKind.Steel,
            ShieldKind.Tower,
            ShieldKind.Steel,
            ShieldKind.Steel,
            ShieldKind.Steel,
            ShieldKind.Steel
        };

        public int Coins { get; private set; }
        public int MinorPotions { get; private set; } = 1;
        public int MaxMinorPotions { get; private set; } = 3;
        public bool HasGateKey { get; private set; }
        public int EquippedShieldSlot { get; private set; }
        public ShieldKind EquippedShield => shieldKinds[EquippedShieldSlot];
        public bool HasTowerShield => shieldSlots[1];
        public bool IsTowerShieldEquipped => EquippedShield == ShieldKind.Tower;
        public string EquippedShieldName => GetShieldName(EquippedShieldSlot);

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

        public void AddTowerShield()
        {
            shieldSlots[1] = true;
            EquippedShieldSlot = 1;
            Debug.Log("Tower shield collected.");
        }

        public bool HasShieldAt(int slot)
        {
            return slot >= 0 && slot < shieldSlots.Length && shieldSlots[slot];
        }

        public string GetShieldName(int slot)
        {
            if (!HasShieldAt(slot)) return "Vacio";
            return shieldKinds[slot] == ShieldKind.Tower ? "Torre" : "Acero";
        }

        public string GetShieldValue(int slot)
        {
            if (!HasShieldAt(slot)) return "";
            return slot == EquippedShieldSlot ? "USO" : "x1";
        }

        public bool SelectShieldSlot(int slot)
        {
            if (!HasShieldAt(slot)) return false;
            EquippedShieldSlot = slot;
            return true;
        }
    }
}
