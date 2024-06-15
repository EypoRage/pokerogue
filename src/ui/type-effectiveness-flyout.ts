import { addTextObject, TextStyle } from "./text";
import BattleScene from "#app/battle-scene.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";
import { WeatherType } from "#app/data/weather.js";
import { TerrainType } from "#app/data/terrain.js";
import { addWindow, WindowVariant } from "./ui-theme";
import { ArenaEvent, ArenaEventType, TagAddedEvent, TagRemovedEvent, TerrainChangedEvent, WeatherChangedEvent } from "#app/field/events/arena";
import { BattleSceneEventType, TurnEndEvent } from "../events/battle-scene";
import { ArenaTagType } from "#app/data/enums/arena-tag-type.js";
import * as Utils from "../utils";
import Sprite from "phaser3-rex-plugins/plugins/gameobjects/mesh/perspective/sprite/Sprite";
import { getTypeRgb, Type } from "#app/data/type.js";
import i18next from "i18next";


export default class TypeEffectivenessFlyout extends Phaser.GameObjects.Container {
  /** An alias for the scene typecast to a {@linkcode BattleScene} */
  private battleScene: BattleScene;

  /** The restricted width of the flyout which should be drawn to */
  private flyoutWidth = 170;
  /** The restricted height of the flyout which should be drawn to */
  private flyoutHeight = 51;

  /** The amount of translation animation on the x-axis */
  private translationX: number;
  /** The x-axis point where the flyout should sit when activated */
  private anchorX: number;
  /** The y-axis point where the flyout should sit when activated */
  private anchorY: number;

  /** The initial container which defines where the flyout should be attached */
  private flyoutParent: Phaser.GameObjects.Container;
  /** The container which defines the drawable dimensions of the flyout */
  private flyoutContainer: Phaser.GameObjects.Container;

  /** The background {@linkcode Phaser.GameObjects.NineSlice} window for the flyout */
  private flyoutWindow: Phaser.GameObjects.NineSlice;

  /** The header {@linkcode Phaser.GameObjects.NineSlice} window for the flyout */
  private flyoutWindowHeader: Phaser.GameObjects.NineSlice;
  /** The {@linkcode Phaser.GameObjects.Text} that goes inside of the header */
  private flyoutTextHeader: Phaser.GameObjects.Text;

  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate the player's effects */
  private flyoutTextHeaderEffective: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate the enemy's effects */
  private flyoutTextHeaderNotEffective: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} header used to indicate neutral effects */
  private flyoutTextHeaderNeutral: Phaser.GameObjects.Text;

  /** The {@linkcode Phaser.GameObjects.Text} used to indicate the player's effects */
  private flyoutTextPlayer: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} used to indicate the enemy's effects */
  private flyoutTextEnemy: Phaser.GameObjects.Text;
  /** The {@linkcode Phaser.GameObjects.Text} used to indicate neutral effects */
  private flyoutTextField: Phaser.GameObjects.Text;

  /** The {@linkcode Phaser.GameObjects.Sprite} used to indicate the player's effects */
  private flyoutSpriteEffective: Phaser.GameObjects.Sprite;

  // Stores callbacks in a variable so they can be unsubscribed from when destroyed
  private readonly onNewArenaEvent =  (event: Event) => this.onNewArena(event);
  private readonly onTurnEndEvent =   (event: Event) => this.onTurnEnd(event);

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.battleScene = this.scene as BattleScene;

    this.translationX = this.flyoutWidth;
    this.anchorX = 0;
    this.anchorY = -98;

    this.flyoutParent = this.scene.add.container(this.anchorX - this.translationX, this.anchorY);
    this.flyoutParent.setAlpha(0);
    this.add(this.flyoutParent);

    this.flyoutContainer = this.scene.add.container(0, 0);
    this.flyoutParent.add(this.flyoutContainer);

    this.flyoutWindow = addWindow(this.scene as BattleScene, 0, 0, this.flyoutWidth, this.flyoutHeight, false, false, 0, 0, WindowVariant.THIN);
    this.flyoutContainer.add(this.flyoutWindow);

    this.flyoutWindowHeader = addWindow(this.scene as BattleScene, this.flyoutWidth / 2, 0, this.flyoutWidth / 2, 14, false, false, 0, 0, WindowVariant.XTHIN);
    this.flyoutWindowHeader.setOrigin();

    this.flyoutContainer.add(this.flyoutWindowHeader);

    this.flyoutTextHeader = addTextObject(this.scene, this.flyoutWidth / 2, 0, "Type Effectiveness", TextStyle.BATTLE_INFO);
    this.flyoutTextHeader.setFontSize(54);
    this.flyoutTextHeader.setAlign("center");
    this.flyoutTextHeader.setOrigin();

    this.flyoutContainer.add(this.flyoutTextHeader);

    this.flyoutTextHeaderEffective = addTextObject(this.scene, 6, 5, "Effective", TextStyle.SUMMARY_GREEN);
    this.flyoutTextHeaderEffective.setFontSize(54);
    this.flyoutTextHeaderEffective.setAlign("left");
    this.flyoutTextHeaderEffective.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderEffective);

    this.flyoutTextHeaderNeutral = addTextObject(this.scene, this.flyoutWidth / 2, 5, "Neutral", TextStyle.SUMMARY_ALT);
    this.flyoutTextHeaderNeutral.setFontSize(54);
    this.flyoutTextHeaderNeutral.setAlign("center");
    this.flyoutTextHeaderNeutral.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderNeutral);

    this.flyoutTextHeaderNotEffective = addTextObject(this.scene, this.flyoutWidth - 6, 5, "Not Effective", TextStyle.SUMMARY_PINK);
    this.flyoutTextHeaderNotEffective.setFontSize(54);
    this.flyoutTextHeaderNotEffective.setAlign("right");
    this.flyoutTextHeaderNotEffective.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextHeaderNotEffective);

    this.flyoutTextPlayer = addTextObject(this.scene, 6, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextPlayer.setLineSpacing(-1);
    this.flyoutTextPlayer.setFontSize(48);
    this.flyoutTextPlayer.setAlign("left");
    this.flyoutTextPlayer.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextPlayer);

    this.getTypeIcon(5,15,Type.DARK);
    this.getTypeIcon(5,23,Type.ICE);
    this.getTypeIcon(5,31,Type.FIRE);
    this.getTypeIcon(5,39,Type.DRAGON);

    this.getTypeIcon(23,15,Type.DARK);
    this.getTypeIcon(23,23,Type.ICE);
    this.getTypeIcon(23,31,Type.FIRE);
    this.getTypeIcon(23,39,Type.DRAGON);


    this.flyoutTextField = addTextObject(this.scene, this.flyoutWidth / 2, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextField.setLineSpacing(-1);
    this.flyoutTextField.setFontSize(48);
    this.flyoutTextField.setAlign("center");
    this.flyoutTextField.setOrigin(0.5, 0);

    this.flyoutContainer.add(this.flyoutTextField);

    this.flyoutTextEnemy = addTextObject(this.scene, this.flyoutWidth - 6, 13, "", TextStyle.BATTLE_INFO);
    this.flyoutTextEnemy.setLineSpacing(-1);
    this.flyoutTextEnemy.setFontSize(48);
    this.flyoutTextEnemy.setAlign("right");
    this.flyoutTextEnemy.setOrigin(1, 0);

    this.flyoutContainer.add(this.flyoutTextEnemy);

    this.name = "Fight Flyout";
    this.flyoutParent.name = "Fight Flyout Parent";

    // Subscribes to required events available on game start
    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.TURN_END,  this.onTurnEndEvent);
  }

  private onNewArena(event: Event) {
    this.updateFieldText();
  }



  /** Clears out the current string stored in all arena effect texts */
  private clearText() {

  }

  private updateFieldText() {
    this.clearText();

  }


  /**
   * Iterates through the fieldEffectInfo array and decrements the duration of each item
   * @param event {@linkcode Event} being sent
   */
  private onTurnEnd(event: Event) {
    const turnEndEvent = event as TurnEndEvent;
    if (!turnEndEvent) {
      return;
    }

    this.updateFieldText();
  }



  getTypeIcon = (xCoord:integer, yCoord:integer, type: Type, tera: boolean = false) => {

    const typeIcon = !tera? this.scene.add.sprite(xCoord,yCoord, `types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`, Type[type].toLowerCase())          : this.scene.add.sprite(xCoord, 42, "type_tera");
    if (tera) {
      typeIcon.setScale(0.35);
      const typeRgb = getTypeRgb(type);
      typeIcon.setTint(Phaser.Display.Color.GetColor(typeRgb[0], typeRgb[1], typeRgb[2]));
    }
    typeIcon.setScale(0.35);
    typeIcon.setOrigin(0, 0);
    //return typeIcon;
    this.flyoutContainer.add(typeIcon);
  };










  /**
   * Animates the flyout to either show or hide it by applying a fade and translation
   * @param visible Should the flyout be shown?
   */
  public toggleFlyout(visible: boolean): void {
    this.scene.tweens.add({
      targets: this.flyoutParent,
      x: visible ? this.anchorX : this.anchorX - this.translationX,
      duration: Utils.fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0,
    });
  }

  public destroy(fromScene?: boolean): void {
    this.battleScene.eventTarget.removeEventListener(BattleSceneEventType.NEW_ARENA, this.onNewArenaEvent);
    this.battleScene.eventTarget.removeEventListener(BattleSceneEventType.TURN_END,  this.onTurnEndEvent);

    super.destroy(fromScene);
  }
}
