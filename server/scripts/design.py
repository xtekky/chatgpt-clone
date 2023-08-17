from typing import Any
import cadquery as cq
import json


def get_quantities(measure: str) -> float:
    qty = ""

    for char in measure:
        if char.isdigit() or char == ".":
            qty += char

    return float(qty)


def gen_shapes(wp, doc: dict[str, str | float | int | None]) -> cq.Workplane:

    for shape in doc["shapes"]:
        if shape["shape"] == "sphere":
            wp = wp.sphere(get_quantities(shape["properties"].get("diameter")) / 2)
        elif shape["shape"] == "hole":
            wp = wp.hole(
                get_quantities(shape["properties"].get("diameter")),
                get_quantities(shape["properties"].get("height")),
                shape["properties"].get("clean", True),
            )

    return wp


def svg_gen(specs: dict[str, Any]) -> str:
    wp = cq.Workplane("XY")
    wp = gen_shapes(wp, specs)
    # display(wp)
    img_data = wp.toSvg()
    img_data = img_data[img_data.find("<svg") : img_data.find("</svg>") + 6]
    return img_data


if __name__ == "__main__":
    a = json.loads(
        """{
    "shapes": [
        {
            "shape": "sphere",
            "properties": {
                "diameter": "2cm",
                "center": {"x": 0, "y": 0}
            }
        },
        {
            "shape": "hole",
            "properties": {
                "diameter": "0.2cm",
                "height": "2cm",
                "position": {"x": 0, "y": 2},
                "clean": "true"
            }
        }
    ]
}
"""
    )
    print(svg_gen(a))
