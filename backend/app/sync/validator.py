# app/sync/validator.py
"""Валидация схемы Excel-файла."""

import logging
import pandas as pd

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Ошибка валидации файла."""
    pass


def validate_excel_schema(df: pd.DataFrame, required_column: str = "Номер УС") -> None:
    """
    Проверяет, что Excel-файл содержит обязательные столбцы.

    Args:
        df: DataFrame с данными из Excel.
        required_column: Имя обязательного столбца (Primary Business Key).

    Raises:
        ValidationError: Если обязательный столбец отсутствует.
    """
    if df.empty:
        raise ValidationError("Файл пуст — нет данных для обработки.")

    columns = list(df.columns)
    logger.info(f"Столбцы в файле: {columns}")

    # Проверка наличия ключа
    if required_column not in columns:
        raise ValidationError(
            f"Обязательный столбец '{required_column}' не найден в файле. "
            f"Доступные столбцы: {columns}"
        )

    # Проверка, что ключ не полностью пустой
    non_null_count = df[required_column].notna().sum()
    if non_null_count == 0:
        raise ValidationError(
            f"Столбец '{required_column}' полностью пуст — нечего синхронизировать."
        )

    logger.info(f"Валидация пройдена. Непустых ключей: {non_null_count}")


def validate_file_extension(file_path: str) -> bool:
    """Проверяет расширение файла."""
    return file_path.lower().endswith((".xlsx", ".xls"))
