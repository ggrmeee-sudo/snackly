const _assetBase = import.meta.env.BASE_URL || "/";

export const PRODUCTS = {
    "all-day-smoothie-orange-banana-strawberry": {
      image: _assetBase + "assets/product-all-day-smoothie-orange-banana-strawberry.png",
      title:
        "Смузи с апельсином бананом и клубникой All Day",
      bullets: [],
      desc:
        "Яркий смузи-микс из спелых апельсинов, банана и клубники для лёгкого завтрака или подзарядки в течение дня.",
      price: "329 ₽",
      weight: "300 мл",
    },
    "all-day-lemonade-puer-cola": {
      image: _assetBase + "assets/product-all-day-lemonade-puer-cola.png",
      title:
        "Лимонад Пуэр кола газированный All Day",
      bullets: [],
      desc:
        "В основе напитка — чай пуэр с добавлением специй: гвоздики, ванили и бобов тонка. Их дополняют натуральный сок лайма и выраженный аромат колы.",
      price: "223 ₽",
      weight: "300 мл",
    },
    "all-day-smoothie-blueberry-banana-almond": {
      image: _assetBase + "assets/product-all-day-smoothie-blueberry-banana-almond.png",
      title:
        "Смузи черника, банан, миндаль All Day",
      bullets: [],
      desc:
        "Одно из любимых питательных блюд спортсменов — смузи. В этот добавили чернику, банан, миндальное молоко, рисовую крупу и миндаль.",
      price: "230 ₽",
      weight: "300 мл",
    },
    "smoothie-all-day": {
      image: _assetBase + "assets/product-smoothie-all-day.png",
      title: "Смузи лесные ягоды All Day",
      bullets: [],
      desc:
        "Этот ягодный чай готовят из клубники, малины, чёрной смородины и клюквы, которая добавляет вкусу деликатную горечь. Напиток одновременно напоминает газированный лимонад и смузи.",
      price: "329 ₽",
      weight: "300 мл",
    },
    "fitnessshock-hi-protein": {
      image: _assetBase + "assets/product-fitnessshock-hi-protein.png",
      title:
        "Батончик FitnesShock Hi Protein, 30% протеина, без сахара, черничный десерт, в глазури",
      bullets: [],
      desc:
        "Высокобелковый батончик с 30% протеина и без сахара. Черничный десерт в глазури — полезная альтернатива сладостям для спортсменов и приверженцев ЗОЖ. Поддерживает мышцы и дарит долгое чувство сытости без скачков сахара.",
      price: "165 ₽",
      weight: "40 г",
    },
    "fitnessshock-lemon-chia": {
      image: _assetBase + "assets/product-fitnessshock-lemon-chia.png",
      title:
        "Батончик FitnesShock Hi Protein, 30% протеина, без сахара, лимон и чиа, в глазури",
      bullets: [],
      desc:
        "Высокобелковый батончик с 30% протеина, без сахара. Сочетание лимона и семян чиа в глазури — освежающий перекус для энергии и сытости. Без скачков сахара, поддерживает мышцы и нормализует пищеварение благодаря чиа.",
      price: "179 ₽",
      weight: "40 г",
    },
    "fitnessshock-pecan-tart": {
      image: _assetBase + "assets/product-fitnessshock-pecan-tart.png",
      title:
        "Батончик FitnesShock, 30% протеина, без сахара, глазированный, пекан-тарт",
      bullets: [],
      desc:
        "Высокобелковый батончик с 30% протеина, без сахара, в глазури. Вкус домашнего пекан-тарта без вреда для фигуры. Насыщает, поддерживает мышцы и утоляет тягу к сладкому без скачков сахара.",
      price: "159 ₽",
      weight: "40 г",
    },
    "fitnessshock-strawberry-mojito": {
      image: _assetBase + "assets/product-fitnessshock-strawberry-mojito.png",
      title:
        "Глазированый батончик FitnesShock, 30% протеина, клубника и мята",
      bullets: [],
      desc:
        "Освежающий высокобелковый батончик с 30% протеина, без сахара, в глазури. Сочетание сочной клубники и прохладной мяты — необычный десерт для ЗОЖ. Дарит энергию, насыщает и помогает восстановиться после тренировки без лишнего сахара.",
      price: "109 ₽",
      weight: "40 г",
    },
    "semushka-apricot": {
      image: _assetBase + "assets/product-semushka-apricot.png",
      title: "Курага «Семушка»",
      bullets: [],
      desc:
        "Сушёные абрикосы удобно взять с собой в качестве перекуса. В них нет добавленного сахара, что оценит тот, кто следит за питанием.",
      price: "223 ₽",
      weight: "150 г",
    },
    "semushka-walnut": {
      image: _assetBase + "assets/product-semushka-walnut.png",
      title: "Грецкий орех «Семушка»",
      bullets: [],
      desc:
        "Эти грецкие орехи можно добавить в выпечку или съесть в качестве перекуса. В них сочетаются насыщенный вкус и полезные свойства.",
      price: "496 ₽",
      weight: "200 г",
    },
    "semushka-almond": {
      image: _assetBase + "assets/product-semushka-almond.png",
      title: "Миндаль сушёный «Семушка», 120 г",
      bullets: [],
      desc:
        "Этот миндаль сушат, чтобы сохранить его вкус. Он подходит для перекуса или добавления в десерты.",
      price: "258 ₽",
      weight: "120 г",
    },
    "semushka-cashew": {
      image: _assetBase + "assets/product-semushka-cashew.png",
      title: "Кешью жареный «Семушка»",
      bullets: [],
      desc:
        "Эти жарёные ядра кешью можно добавить в салат или съесть в качестве перекуса. Они упакованы в компактную пачку, которая удобно поместится в сумку.",
      price: "101 ₽",
      weight: "50 г",
    },
  };
