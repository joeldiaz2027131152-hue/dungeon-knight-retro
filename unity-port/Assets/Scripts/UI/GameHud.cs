using DungeonKnight.Combat;
using DungeonKnight.Player;
using UnityEngine;

namespace DungeonKnight.UI
{
    public class GameHud : MonoBehaviour
    {
        private Health playerHealth;
        private PlayerController2D controller;
        private PlayerInventory inventory;
        private GUIStyle labelStyle;
        private GUIStyle smallStyle;
        private GUIStyle valueStyle;
        private GUIStyle slotLabelStyle;
        private GUIStyle slotValueStyle;
        private GUIStyle slotIconStyle;
        private GUIStyle miniSlotStyle;
        private GUIStyle miniValueStyle;
        private GUIStyle subDescriptionStyle;
        private bool inventoryOpen;
        private bool weaponsOpen;
        private bool shieldsOpen;
        private bool consumablesOpen;
        private bool relicsOpen;

        public void Bind(GameObject player)
        {
            playerHealth = player.GetComponent<Health>();
            controller = player.GetComponent<PlayerController2D>();
            inventory = player.GetComponent<PlayerInventory>();
        }

        private void OnGUI()
        {
            if (!playerHealth || !controller || !inventory) return;

            labelStyle ??= new GUIStyle(GUI.skin.label)
            {
                fontSize = 17,
                normal = { textColor = new Color(0.92f, 0.88f, 0.78f) },
                fontStyle = FontStyle.Bold
            };
            valueStyle ??= new GUIStyle(labelStyle)
            {
                fontSize = 16,
                alignment = TextAnchor.MiddleRight,
                normal = { textColor = new Color(1f, 0.86f, 0.45f) }
            };
            smallStyle ??= new GUIStyle(labelStyle)
            {
                fontSize = 13,
                fontStyle = FontStyle.Normal,
                normal = { textColor = new Color(0.78f, 0.82f, 0.86f, 0.88f) },
                wordWrap = true
            };
            slotLabelStyle ??= new GUIStyle(labelStyle)
            {
                fontSize = 10,
                alignment = TextAnchor.LowerCenter,
                normal = { textColor = new Color(0.78f, 0.82f, 0.86f, 0.92f) },
                wordWrap = false
            };
            slotValueStyle ??= new GUIStyle(labelStyle)
            {
                fontSize = 12,
                alignment = TextAnchor.UpperRight,
                normal = { textColor = new Color(1f, 0.86f, 0.45f) },
                wordWrap = false
            };
            slotIconStyle ??= new GUIStyle(labelStyle)
            {
                fontSize = 18,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = new Color(1f, 0.86f, 0.45f) },
                wordWrap = false
            };
            miniSlotStyle ??= new GUIStyle(labelStyle)
            {
                fontSize = 8,
                alignment = TextAnchor.LowerCenter,
                normal = { textColor = new Color(0.82f, 0.84f, 0.9f, 0.92f) },
                wordWrap = false
            };
            miniValueStyle ??= new GUIStyle(labelStyle)
            {
                fontSize = 9,
                alignment = TextAnchor.UpperRight,
                normal = { textColor = new Color(1f, 0.86f, 0.45f) },
                wordWrap = false
            };
            subDescriptionStyle ??= new GUIStyle(smallStyle)
            {
                fontSize = 11,
                alignment = TextAnchor.UpperLeft,
                wordWrap = true
            };

            if (Event.current.type == EventType.KeyDown && Event.current.keyCode == KeyCode.I)
            {
                inventoryOpen = !inventoryOpen;
                if (!inventoryOpen)
                {
                    weaponsOpen = false;
                    shieldsOpen = false;
                    consumablesOpen = false;
                    relicsOpen = false;
                }
                RetroAudio.Play("secret");
                Event.current.Use();
            }

            GUI.Label(new Rect(22, 18, 220, 24), "Caballero del Umbral", labelStyle);
            DrawBar(new Rect(22, 44, 230, 18), playerHealth.CurrentHealth / (float)playerHealth.MaxHealth, new Color(0.72f, 0.08f, 0.1f), new Color(1f, 0.25f, 0.22f), "HP", $"{playerHealth.CurrentHealth}/{playerHealth.MaxHealth}");
            bool lowStamina = controller.Stamina <= 18f;
            DrawBar(new Rect(22, 72, 230, 18), controller.Stamina / controller.MaxStamina, lowStamina ? new Color(0.55f, 0.16f, 0.08f) : new Color(0.08f, 0.46f, 0.22f), lowStamina ? new Color(1f, 0.5f, 0.18f) : new Color(0.28f, 0.9f, 0.42f), "ST", $"{Mathf.RoundToInt(controller.Stamina)}/{Mathf.RoundToInt(controller.MaxStamina)}");
            if (controller.HasStaminaWarning)
            {
                DrawSoftBox(new Rect(22, 96, 230, 22), new Color(0.42f, 0.08f, 0.04f, 0.88f), new Color(1f, 0.48f, 0.18f, 0.9f));
                GUI.Label(new Rect(32, 97, 210, 22), "Stamina insuficiente", smallStyle);
            }

            Rect help = new Rect(18, Screen.height - 38, 700, 26);
            DrawSoftBox(help, new Color(0.04f, 0.045f, 0.065f, 0.76f), new Color(0.55f, 0.47f, 0.32f, 0.75f));
            GUI.Label(new Rect(help.x + 12, help.y + 4, help.width - 24, help.height), "J: ataque   Mantener J: golpe cargado   K: escudo/parry   L: rodar   I: inventario", smallStyle);

            DrawQuickInventory();

            if (inventoryOpen)
            {
                DrawInventoryPanel();
            }
        }

        private void DrawQuickInventory()
        {
            float width = 236f;
            Rect panel = new Rect(Screen.width - width - 18f, Screen.height - 82f, width, 48f);
            DrawSoftBox(panel, new Color(0.035f, 0.035f, 0.052f, 0.84f), new Color(0.52f, 0.41f, 0.24f, 0.72f));
            DrawInventoryPill(new Rect(panel.x + 10f, panel.y + 10f, 96f, 28f), "Monedas", inventory.Coins.ToString(), new Color(1f, 0.82f, 0.28f));
            DrawInventoryPill(new Rect(panel.x + 116f, panel.y + 10f, 110f, 28f), "Pociones", $"{inventory.MinorPotions}/{inventory.MaxMinorPotions}", new Color(0.9f, 0.18f, 0.24f));
        }

        private void DrawInventoryPanel()
        {
            float width = 320f;
            float height = 560f;
            Rect panel = new Rect(Screen.width - width - 18f, 18f, width, height);
            if (panel.x < 12f)
            {
                panel.x = 12f;
            }

            DrawSoftBox(panel, new Color(0.035f, 0.035f, 0.052f, 0.96f), new Color(0.72f, 0.55f, 0.28f, 0.94f));
            DrawRect(new Rect(panel.x + 12f, panel.y + 38f, panel.width - 24f, 2f), new Color(1f, 0.78f, 0.34f, 0.24f));
            GUI.Label(new Rect(panel.x + 18f, panel.y + 10f, panel.width - 36f, 28f), "EQUIPAMIENTO", labelStyle);

            Rect weaponSlot = new Rect(panel.x + 18f, panel.y + 52f, panel.width - 36f, 48f);
            DrawEquipmentSlot(weaponSlot, "ARMA PRINCIPAL", "Espada inicial", weaponsOpen ? new Color(0.88f, 0.95f, 1f) : new Color(0.72f, 0.88f, 1f), "S");
            if (GUI.Button(weaponSlot, GUIContent.none, GUIStyle.none))
            {
                weaponsOpen = !weaponsOpen;
                shieldsOpen = false;
                consumablesOpen = false;
                relicsOpen = false;
                RetroAudio.Play("secret");
            }

            Rect shieldSlot = new Rect(panel.x + 18f, panel.y + 108f, panel.width - 36f, 48f);
            Color shieldAccent = inventory.IsTowerShieldEquipped ? new Color(1f, 0.82f, 0.28f) : new Color(0.62f, 0.66f, 0.74f);
            DrawEquipmentSlot(shieldSlot, "ESCUDO", inventory.EquippedShieldName, shieldsOpen ? new Color(0.8f, 0.86f, 0.98f) : shieldAccent, "D");
            if (GUI.Button(shieldSlot, GUIContent.none, GUIStyle.none))
            {
                shieldsOpen = !shieldsOpen;
                weaponsOpen = false;
                consumablesOpen = false;
                relicsOpen = false;
                RetroAudio.Play("secret");
            }

            Rect relicSlot = new Rect(panel.x + 18f, panel.y + 164f, panel.width - 36f, 48f);
            DrawEquipmentSlot(relicSlot, "RELIQUIA", "Sin reliquia", relicsOpen ? new Color(1f, 0.8f, 0.28f) : new Color(0.78f, 0.58f, 0.25f), "R");
            if (GUI.Button(relicSlot, GUIContent.none, GUIStyle.none))
            {
                relicsOpen = !relicsOpen;
                weaponsOpen = false;
                shieldsOpen = false;
                consumablesOpen = false;
                RetroAudio.Play("secret");
            }

            GUI.Label(new Rect(panel.x + 18f, panel.y + 226f, panel.width - 36f, 18f), "POCIONES Y CONSUMIBLES", smallStyle);

            float slotSize = 66f;
            float gap = 12f;
            float startX = panel.x + 18f;
            float startY = panel.y + 252f;
            DrawSlot(new Rect(startX, startY, slotSize, slotSize), "Pocion", $"x{inventory.MinorPotions}", new Color(0.9f, 0.18f, 0.24f), inventory.MinorPotions > 0, "P");
            DrawSlot(new Rect(startX + slotSize + gap, startY, slotSize, slotSize), "Mayor", "--", new Color(0.45f, 0.3f, 0.9f), false, "+");
            DrawSlot(new Rect(startX + (slotSize + gap) * 2f, startY, slotSize, slotSize), "Bayas", "--", new Color(0.9f, 0.18f, 0.24f), false, "B");

            Rect bagSlot = new Rect(startX, startY + slotSize + gap, slotSize, slotSize);
            DrawSlot(bagSlot, "Bolsa", "6", new Color(0.25f, 0.85f, 0.46f), true, "O", consumablesOpen);
            if (GUI.Button(bagSlot, GUIContent.none, GUIStyle.none))
            {
                consumablesOpen = !consumablesOpen;
                weaponsOpen = false;
                shieldsOpen = false;
                relicsOpen = false;
                RetroAudio.Play("secret");
            }

            DrawSlot(new Rect(startX + slotSize + gap, startY + slotSize + gap, slotSize, slotSize), "Monedas", inventory.Coins.ToString(), new Color(1f, 0.82f, 0.28f), true, "$");
            DrawSlot(new Rect(startX + (slotSize + gap) * 2f, startY + slotSize + gap, slotSize, slotSize), "Llave", inventory.HasGateKey ? "x1" : "x0", inventory.HasGateKey ? new Color(1f, 0.82f, 0.28f) : new Color(0.36f, 0.38f, 0.42f), inventory.HasGateKey, "K");

            if (weaponsOpen)
            {
                DrawSubInventory(panel, "RESERVA DE ARMAS", "Aqui podras escoger entre 6 armas cuando las anadamos.", new[] { "Espada", "Vacio", "Vacio", "Vacio", "Vacio", "Vacio" }, new[] { "USO", "", "", "", "", "" }, panel.y + 398f);
            }
            else if (shieldsOpen)
            {
                DrawShieldInventory(panel, panel.y + 398f);
            }
            else if (consumablesOpen)
            {
                DrawSubInventory(panel, "BOLSA DE CONSUMIBLES", "Los espacios de bayas y objetos se llenaran al recogerlos.", new[] { "Pocion", "Vacio", "Vacio", "Vacio", "Vacio", "Vacio" }, new[] { $"x{inventory.MinorPotions}", "", "", "", "", "" }, panel.y + 398f);
            }
            else if (relicsOpen)
            {
                DrawSubInventory(panel, "RESERVA DE RELIQUIAS", "Aqui escogeras una reliquia activa cuando las anadamos.", new[] { "Vacio", "Vacio", "Vacio", "Vacio", "Vacio", "Vacio" }, new[] { "", "", "", "", "", "" }, panel.y + 398f);
            }
            else
            {
                DrawRect(new Rect(panel.x + 12f, panel.y + 430f, panel.width - 24f, 1.5f), new Color(1f, 0.78f, 0.34f, 0.2f));
                GUI.Label(new Rect(panel.x + 18f, panel.y + 440f, panel.width - 36f, 44f), "Click en Arma, Escudo, Reliquia o Bolsa para abrir 6 cuadros. I: cerrar.", smallStyle);
            }
        }

        private void DrawEquipmentSlot(Rect rect, string title, string name, Color accent, string icon)
        {
            DrawSoftBox(rect, new Color(0.055f, 0.055f, 0.075f, 0.92f), new Color(accent.r, accent.g, accent.b, 0.58f));
            DrawRect(new Rect(rect.x + 8f, rect.y + 8f, 32f, rect.height - 16f), new Color(accent.r, accent.g, accent.b, 0.24f));
            GUI.Label(new Rect(rect.x + 15f, rect.y + 10f, 20f, 20f), icon, valueStyle);
            GUI.Label(new Rect(rect.x + 50f, rect.y + 5f, rect.width - 60f, 18f), title, smallStyle);
            GUI.Label(new Rect(rect.x + 50f, rect.y + 23f, rect.width - 60f, 20f), name, labelStyle);
        }

        private void DrawSlot(Rect rect, string title, string value, Color accent, bool active, string icon, bool selected = false)
        {
            Color border = active ? new Color(accent.r, accent.g, accent.b, selected ? 1f : 0.78f) : new Color(0.25f, 0.25f, 0.32f, 0.7f);
            Color fill = active ? new Color(0.045f, 0.045f, 0.065f, 0.94f) : new Color(0.035f, 0.035f, 0.048f, 0.78f);
            DrawSoftBox(rect, fill, border);
            if (active)
            {
                DrawRect(new Rect(rect.x + 7f, rect.y + 7f, rect.width - 14f, rect.height - 14f), new Color(accent.r, accent.g, accent.b, selected ? 0.18f : 0.08f));
            }

            GUI.Label(new Rect(rect.x + 8f, rect.y + 11f, rect.width - 16f, 24f), icon, slotIconStyle);
            GUI.Label(new Rect(rect.x + 3f, rect.y + rect.height - 20f, rect.width - 6f, 16f), title, slotLabelStyle);
            GUI.Label(new Rect(rect.x + rect.width - 32f, rect.y + 4f, 27f, 16f), value, slotValueStyle);
        }

        private void DrawSubInventory(Rect panel, string title, string description, string[] names, string[] values, float y)
        {
            Rect subPanel = new Rect(panel.x + 12f, y, panel.width - 24f, 134f);
            DrawSoftBox(subPanel, new Color(0.028f, 0.028f, 0.044f, 0.94f), new Color(0.52f, 0.42f, 0.26f, 0.82f));
            GUI.Label(new Rect(subPanel.x + 10f, subPanel.y + 5f, subPanel.width - 20f, 18f), title, smallStyle);

            float size = 42f;
            float gap = 10f;
            float x = subPanel.x + 10f;
            float gridY = subPanel.y + 26f;
            for (int i = 0; i < 6; i++)
            {
                int column = i % 3;
                int row = i / 3;
                Rect slot = new Rect(x + column * (size + gap), gridY + row * (size + gap), size, size);
                bool active = !string.IsNullOrEmpty(values[i]);
                DrawMiniSlot(slot, active ? names[i] : "", values[i], active ? new Color(0.9f, 0.18f, 0.24f) : new Color(0.3f, 0.3f, 0.36f));
            }

            GUI.Label(new Rect(subPanel.x + 166f, subPanel.y + 28f, subPanel.width - 176f, 88f), description, subDescriptionStyle);
        }

        private void DrawShieldInventory(Rect panel, float y)
        {
            Rect subPanel = new Rect(panel.x + 12f, y, panel.width - 24f, 134f);
            DrawSoftBox(subPanel, new Color(0.028f, 0.028f, 0.044f, 0.94f), new Color(0.52f, 0.42f, 0.26f, 0.82f));
            GUI.Label(new Rect(subPanel.x + 10f, subPanel.y + 5f, subPanel.width - 20f, 18f), "RESERVA DE ESCUDOS", smallStyle);

            float size = 42f;
            float gap = 10f;
            float x = subPanel.x + 10f;
            float gridY = subPanel.y + 26f;
            for (int i = 0; i < 6; i++)
            {
                int column = i % 3;
                int row = i / 3;
                Rect slot = new Rect(x + column * (size + gap), gridY + row * (size + gap), size, size);
                bool active = inventory.HasShieldAt(i);
                bool selected = active && inventory.EquippedShieldSlot == i;
                Color accent = i == 1 ? new Color(1f, 0.78f, 0.22f) : new Color(0.62f, 0.66f, 0.74f);
                DrawMiniSlot(slot, active ? inventory.GetShieldName(i) : "", inventory.GetShieldValue(i), active ? accent : new Color(0.3f, 0.3f, 0.36f), selected);
                if (active && GUI.Button(slot, GUIContent.none, GUIStyle.none))
                {
                    inventory.SelectShieldSlot(i);
                    RetroAudio.Play("secret");
                }
            }

            GUI.Label(new Rect(subPanel.x + 166f, subPanel.y + 28f, subPanel.width - 176f, 88f), "Click en un escudo guardado para equiparlo. El Escudo de la Torre reduce la estamina al bloquear.", subDescriptionStyle);
        }

        private void DrawMiniSlot(Rect rect, string title, string value, Color accent, bool selected = false)
        {
            bool active = !string.IsNullOrEmpty(value);
            DrawSoftBox(rect, new Color(0.04f, 0.04f, 0.058f, 0.92f), active ? new Color(accent.r, accent.g, accent.b, selected ? 1f : 0.72f) : new Color(0.24f, 0.24f, 0.3f, 0.64f));
            if (active)
            {
                DrawRect(new Rect(rect.x + 6f, rect.y + 6f, rect.width - 12f, rect.height - 12f), new Color(accent.r, accent.g, accent.b, selected ? 0.26f : 0.18f));
            }
            GUI.Label(new Rect(rect.x + 3f, rect.y + rect.height - 15f, rect.width - 6f, 12f), title, miniSlotStyle);
            GUI.Label(new Rect(rect.x + rect.width - 24f, rect.y + 3f, 20f, 12f), value, miniValueStyle);
        }

        private void DrawBar(Rect rect, float amount, Color darkFill, Color brightFill, string label, string value)
        {
            DrawSoftBox(new Rect(rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8), new Color(0.02f, 0.02f, 0.03f, 0.72f), new Color(0.48f, 0.39f, 0.24f, 0.62f));
            DrawRect(rect, new Color(0.02f, 0.02f, 0.03f, 0.92f));
            float width = rect.width * Mathf.Clamp01(amount);
            DrawRect(new Rect(rect.x, rect.y, width, rect.height), darkFill);
            DrawRect(new Rect(rect.x, rect.y, width, rect.height * 0.38f), brightFill);
            DrawRect(new Rect(rect.x, rect.y, rect.width, 2f), new Color(1f, 1f, 1f, 0.18f));

            GUI.color = Color.white;
            GUI.Label(new Rect(rect.x + 8, rect.y - 4, 60, rect.height + 8), label, labelStyle);
            GUI.Label(new Rect(rect.x + 70, rect.y - 4, rect.width - 78, rect.height + 8), value, valueStyle);
        }

        private void DrawInventoryPill(Rect rect, string label, string value, Color accent)
        {
            DrawSoftBox(rect, new Color(0.055f, 0.055f, 0.075f, 0.94f), new Color(0.43f, 0.35f, 0.22f, 0.72f));
            DrawRect(new Rect(rect.x + 6, rect.y + 6, 10, rect.height - 12), accent);
            GUI.Label(new Rect(rect.x + 22, rect.y + 3, rect.width - 48, rect.height), label, smallStyle);
            GUI.Label(new Rect(rect.x + rect.width - 44, rect.y + 3, 36, rect.height), value, valueStyle);
        }

        private void DrawPanel(Rect rect)
        {
            DrawSoftBox(rect, new Color(0.035f, 0.035f, 0.052f, 0.94f), new Color(0.62f, 0.48f, 0.25f, 0.9f));
            DrawRect(new Rect(rect.x + 10, rect.y + 8, rect.width - 20, 1.5f), new Color(1f, 0.78f, 0.34f, 0.36f));
            DrawRect(new Rect(rect.x + 10, rect.y + rect.height - 9, rect.width - 20, 1.5f), new Color(1f, 0.78f, 0.34f, 0.24f));
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
