import json
import os
import re
import xml.etree.ElementTree as ET
from typing import Any, Dict


LINE_PATTERN = re.compile(r"^line\d+$")


def derive_list_key(parent_tag: str) -> str:
    """
    Dérive la clé de tableau à partir du nom du parent.
    Exemple: 'props.conditions' -> 'conditions'
    """
    if "." in parent_tag:
        return parent_tag.split(".")[-1]
    return parent_tag


def set_nested(target: Dict[str, Any], dotted_key: str, value: Any) -> None:
    """
    Place une valeur dans un dictionnaire en créant des niveaux imbriqués
    pour les noms avec des points (ex: 'texts.name' -> target['texts']['name']).
    Si la clé finale existe déjà :
      - si c'est une liste, on ajoute
      - sinon on transforme en liste.
    """
    parts = dotted_key.split(".")
    current = target
    for part in parts[:-1]:
        if part not in current or not isinstance(current[part], dict):
            current[part] = {}
        current = current[part]

    last = parts[-1]
    if last not in current:
        current[last] = value
    else:
        existing = current[last]
        if isinstance(existing, list):
            existing.append(value)
        else:
            current[last] = [existing, value]


def xml_node_to_obj(elem: ET.Element) -> Any:
    """
    Convertit récursivement un élément XML en structure Python,
    selon les règles du plan.
    """
    obj: Dict[str, Any] = {}

    # Attributs sous _attrs
    if elem.attrib:
        obj["_attrs"] = dict(elem.attrib)

    children = list(elem)

    # Aucun enfant structuré : stocker le texte sous "value"
    if not children:
        text = (elem.text or "").strip()
        if text:
            obj["value"] = text
        return obj

    # Gestion spéciale des enfants line0, line1, ...
    line_children = [c for c in children if LINE_PATTERN.match(c.tag)]
    other_children = [c for c in children if not LINE_PATTERN.match(c.tag)]

    if line_children:
        list_key = derive_list_key(elem.tag)
        obj[list_key] = [xml_node_to_obj(c) for c in line_children]

    # Regrouper les autres enfants par nom de tag
    grouped: Dict[str, list] = {}
    for child in other_children:
        grouped.setdefault(child.tag, []).append(child)

    for tag, elems in grouped.items():
        if len(elems) == 1:
            value = xml_node_to_obj(elems[0])
        else:
            value = [xml_node_to_obj(e) for e in elems]
        set_nested(obj, tag, value)

    return obj


def convert_sheet(sheet_elem: ET.Element) -> Dict[str, Any]:
    """
    Convertit un élément <sheet> en objet Python.
    Chaque enfant direct devient une propriété de l'objet racine.
    """
    result: Dict[str, Any] = {}
    for child in sheet_elem:
        # Les enfants directs du sheet sont pris tels quels comme clés racines
        key = child.tag
        # Même logique de noms avec points que pour les nœuds internes
        value = xml_node_to_obj(child)
        set_nested(result, key, value)
    return result


def main() -> None:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    xml_path = os.path.join(base_dir, "export.xml")

    if not os.path.isfile(xml_path):
        raise FileNotFoundError(f"Fichier XML introuvable: {xml_path}")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    # Chaque <sheet name="X"> devient X.json
    for sheet in root.findall("sheet"):
        sheet_name = sheet.get("name")
        if not sheet_name:
            continue

        sheet_obj = convert_sheet(sheet)

        json_filename = f"{sheet_name}.json"
        json_path = os.path.join(base_dir, json_filename)

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(sheet_obj, f, ensure_ascii=False, indent=2)

        print(f"Écrit: {json_path}")


if __name__ == "__main__":
    main()

