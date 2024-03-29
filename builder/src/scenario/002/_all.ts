import * as СозданиеВыключателя from "./input/СозданиеВыключателя";
import * as СозданиеЗаземляющегоРазъединителя from "./input/СозданиеЗаземляющегоРазъединителя";
// import * as СозданиеКА from "./input/СозданиеКА";
import * as СозданиеЛЭП04 from "./input/СозданиеЛЭП04";
import * as СозданиеПодстанции from "./input/СозданиеПодстанции";
import * as СозданиеПредохранителя from "./input/СозданиеПредохранителя";
import * as СозданиеРазрядника from "./input/СозданиеРазрядника";
import * as СозданиеРазъединителя from "./input/СозданиеРазъединителя";
import * as СозданиеРУ from "./input/СозданиеРУ";
import * as СозданиеСШ from "./input/СозданиеСШ";
import * as СозданиеТрансформатора from "./input/СозданиеТрансформатора";
import * as СозданиеТрансформатораНапряжения from "./input/СозданиеТрансформатораНапряжения";
import * as СозданиеТрансформатораТока from "./input/СозданиеТрансформатораТока";
import * as СозданиеЯчейки from "./input/СозданиеЯчейки";
import * as УдалениеВыключателя from "./input/УдалениеВыключателя";
import * as УдалениеЗаземляющегоРазъединителя from "./input/УдалениеЗаземляющегоРазъединителя";
// import * as УдалениеКА from "./input/УдалениеКА";
import * as УдалениеЛЭП04 from "./input/УдалениеЛЭП04";
import * as УдалениеПодстанции from "./input/УдалениеПодстанции";
import * as УдалениеПредохранителя from "./input/УдалениеПредохранителя";
import * as УдалениеРазрядника from "./input/УдалениеРазрядника";
import * as УдалениеРазъединителя from "./input/УдалениеРазъединителя";
import * as УдалениеРУ from "./input/УдалениеРУ";
import * as УдалениеСШ from "./input/УдалениеСШ";
import * as УдалениеТрансформатора from "./input/УдалениеТрансформатора";
import * as УдалениеТрансформатораНапряжения from "./input/УдалениеТрансформатораНапряжения";
import * as УдалениеТрансформатораТока from "./input/УдалениеТрансформатораТока";
import * as УдалениеЯчейки from "./input/УдалениеЯчейки";
import * as СозданиеЛЭП from "./input/СозданиеЛЭП";
import * as BusbarSection from "./postprocess/BusbarSection";
export const flows = [
  СозданиеВыключателя.flow,
  СозданиеЗаземляющегоРазъединителя.flow,
  // СозданиеКА.flow,
  СозданиеЛЭП.flow,
  СозданиеЛЭП04.flow,
  СозданиеПодстанции.flow,
  СозданиеПредохранителя.flow,
  СозданиеРазрядника.flow,
  СозданиеРазъединителя.flow,
  СозданиеРУ.flow,
  СозданиеСШ.flow,
  СозданиеТрансформатора.flow,
  СозданиеТрансформатораНапряжения.flow,
  СозданиеТрансформатораТока.flow,
  СозданиеЯчейки.flow,
  УдалениеВыключателя.flow,
  УдалениеЗаземляющегоРазъединителя.flow,
  // УдалениеКА.flow,
  УдалениеЛЭП04.flow,
  УдалениеПодстанции.flow,
  УдалениеПредохранителя.flow,
  УдалениеРазрядника.flow,
  УдалениеРазъединителя.flow,
  УдалениеРУ.flow,
  УдалениеСШ.flow,
  УдалениеТрансформатора.flow,
  УдалениеТрансформатораНапряжения.flow,
  УдалениеТрансформатораТока.flow,
  УдалениеЯчейки.flow,
  BusbarSection.flow,
];
