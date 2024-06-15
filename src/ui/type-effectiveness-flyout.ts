import { addTextObject, TextStyle } from "./text";
import BattleScene from "#app/battle-scene.js";
import { addWindow, WindowVariant } from "./ui-theme";
import { BattleSceneEventType, TurnEndEvent, PostSummonEvent } from "../events/battle-scene";
import * as Utils from "../utils";
import { getTypeRgb, Type } from "#app/data/type.js";
import i18next from "i18next";
import Pokemon from "#app/field/pokemon.js";
import { calculateAndSortDamageMultipliers } from "#app/data/typeEffectiveness.js";
import Sprite from "phaser3-rex-plugins/plugins/gameobjects/mesh/perspective/sprite/Sprite";


export default class TypeEffectivenessFlyout extends Phaser.GameObjects.Container {
  /** An alias for the scene typecast to a {@linkcode BattleScene} */
  private battleScene: BattleScene;

  /** The restricted width of the flyout which should be drawn to */
  private flyoutWidth = 170;
  /** The restricted height of the flyout which should be drawn to */
  private flyoutHeight = 55;

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
 
  private flyoutTextHeader4x: Phaser.GameObjects.Text;
  private flyoutTextHeader2x: Phaser.GameObjects.Text;
  private flyoutTextHeader1x: Phaser.GameObjects.Text;
  private flyoutTextHeader05x: Phaser.GameObjects.Text;
  private flyoutTextHeader025x: Phaser.GameObjects.Text;
  private flyoutTextHeader0x: Phaser.GameObjects.Text;

  private typeIcons: Phaser.GameObjects.Sprite[];


  // Stores callbacks in a variable so they can be unsubscribed from when destroyed
  private readonly onPostSummonEvent =   (event: Event) => this.onPostSummon(event);

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.typeIcons = [];

    this.battleScene = this.scene as BattleScene;

    this.translationX = this.flyoutWidth;
    this.anchorX = 0;
    this.anchorY = -102;

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

    this.flyoutTextHeader = addTextObject(this.scene, this.flyoutWidth / 2, 0, "Type Effectiveness: None", TextStyle.BATTLE_INFO);
    this.flyoutTextHeader.setFontSize(40);
    this.flyoutTextHeader.setAlign("center");
    this.flyoutTextHeader.setOrigin();

    this.flyoutContainer.add(this.flyoutTextHeader);

    this.flyoutTextHeader4x= addTextObject(this.scene, 7, 5, "4x", TextStyle.SUMMARY_GREEN);
    this.flyoutTextHeader4x.setFontSize(54);
    this.flyoutTextHeader4x.setAlign("left");
    this.flyoutTextHeader4x.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeader4x);

    this.flyoutTextHeader2x= addTextObject(this.scene, 27, 5, "2x", TextStyle.SUMMARY_GREEN);
    this.flyoutTextHeader2x.setFontSize(54);
    this.flyoutTextHeader2x.setAlign("left");
    this.flyoutTextHeader2x.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeader2x);

    this.flyoutTextHeader1x= addTextObject(this.scene, 59, 5, "1x", TextStyle.WINDOW);
    this.flyoutTextHeader1x.setFontSize(54);
    this.flyoutTextHeader1x.setAlign("left");
    this.flyoutTextHeader1x.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeader1x);

    this.flyoutTextHeader05x= addTextObject(this.scene, 102, 5, ".5x", TextStyle.SUMMARY_PINK);
    this.flyoutTextHeader05x.setFontSize(54);
    this.flyoutTextHeader05x.setAlign("left");
    this.flyoutTextHeader05x.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeader05x);

    this.flyoutTextHeader025x= addTextObject(this.scene, 133, 5, ".25x", TextStyle.SUMMARY_PINK);
    this.flyoutTextHeader025x.setFontSize(54);
    this.flyoutTextHeader025x.setAlign("left");
    this.flyoutTextHeader025x.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeader025x);

    this.flyoutTextHeader0x= addTextObject(this.scene, 155, 5, "0x", TextStyle.SUMMARY_GRAY);
    this.flyoutTextHeader0x.setFontSize(54);
    this.flyoutTextHeader0x.setAlign("left");
    this.flyoutTextHeader0x.setOrigin(0, 0);

    this.flyoutContainer.add(this.flyoutTextHeader0x);
    

    this.name = "Fight Flyout";
    this.flyoutParent.name = "Fight Flyout Parent";

    // Subscribes to required events available on game start
    this.battleScene.eventTarget.addEventListener(BattleSceneEventType.POST_SUMMON, this.onPostSummonEvent);
  }

   /**
   * Iterates through the fieldEffectInfo array and decrements the duration of each item
   * @param event {@linkcode Event} being sent
   */
  private onPostSummon(event: Event) {
    const postSummonEvent = event as PostSummonEvent;
    if (!postSummonEvent) {
      return;
    }
    this.clearFlyout();
    console.log(postSummonEvent.enemyField)
    this.flyoutTextHeader.setText("Type Effectiveness: " + postSummonEvent.enemyField[0].name)
    const type1 = postSummonEvent.enemyField[0].species.type1
    const type2 = postSummonEvent.enemyField[0].species.type2
    const typeEffectiveness = calculateAndSortDamageMultipliers([Type[type1],Type[type2]])

    this.generateTyoeImages(5,15,12,6,typeEffectiveness, "x4")
    this.generateTyoeImages(25,15,12,6,typeEffectiveness, "x2")
    this.generateTyoeImages(57,15,12,6,typeEffectiveness, "x1")
    this.generateTyoeImages(101,15,12,6,typeEffectiveness, "x05")
    this.generateTyoeImages(133,15,12,6,typeEffectiveness, "x025")
    this.generateTyoeImages(153,15,12,6,typeEffectiveness, "x0")

  }

  getTypeIcon = (xCoord:integer, yCoord:integer, type: string, tera: boolean = false) : Phaser.GameObjects.Sprite => {

    const typeIcon = !tera? this.scene.add.sprite(xCoord,yCoord, `types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`, Type[type].toLowerCase())          : this.scene.add.sprite(xCoord, 42, "type_tera");
    if (tera) {
      typeIcon.setScale(0.35);
      const typeRgb = getTypeRgb(Type[type]);
      typeIcon.setTint(Phaser.Display.Color.GetColor(typeRgb[0], typeRgb[1], typeRgb[2]));
    }
    typeIcon.setScale(0.35);
    typeIcon.setOrigin(0, 0);
    return typeIcon
  };



  generateTyoeImages= (x,y, offsetX, offsetY, typeEffectiveness, category) =>{
    if(typeEffectiveness){
      let typeIcon:Phaser.GameObjects.Sprite; 
      const yOrigin = y

      typeEffectiveness[category].forEach((type, i) => {
        typeIcon = this.getTypeIcon(x,y,Type[type]);
        this.typeIcons.push(typeIcon);
        this.flyoutContainer.add(typeIcon);

        y = y+ offsetY

        if ((i + 1) % 6 === 0){
          y = yOrigin
          x = x + offsetX
        }

      });
    }
  }

  /**
  * Clears labels and images for the next summoned enemy pokemon
  */
  clearFlyout = () =>{
    this.typeIcons.forEach((typeIcon)=>{
      typeIcon.destroy();
    })
  }

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
    this.battleScene.eventTarget.removeEventListener(BattleSceneEventType.POST_SUMMON,  this.onPostSummonEvent);
    super.destroy(fromScene);
  }
}
