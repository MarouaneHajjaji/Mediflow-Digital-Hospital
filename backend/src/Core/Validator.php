<?php

declare(strict_types=1);

namespace App\Core;

final class Validator
{
    public static function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;
            $rulesList = explode('|', $fieldRules);

            foreach ($rulesList as $rule) {
                if ($rule === 'required' && ($value === null || $value === '')) {
                    $errors[$field][] = 'This field is required.';
                }

                if ($value === null || $value === '') {
                    continue;
                }

                if ($rule === 'integer' && filter_var($value, FILTER_VALIDATE_INT) === false) {
                    $errors[$field][] = 'This field must be an integer.';
                }

                if ($rule === 'numeric' && !is_numeric($value)) {
                    $errors[$field][] = 'This field must be numeric.';
                }

                if ($rule === 'date' && strtotime((string) $value) === false) {
                    $errors[$field][] = 'This field must be a valid date.';
                }

                if ($rule === 'boolean' && filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === null) {
                    $errors[$field][] = 'This field must be boolean.';
                }

                if ($rule === 'string' && !is_string($value)) {
                    $errors[$field][] = 'This field must be a string.';
                }

                if (str_starts_with($rule, 'in:')) {
                    $allowed = explode(',', substr($rule, 3));
                    if (!in_array((string) $value, $allowed, true)) {
                        $errors[$field][] = 'This field contains an invalid value.';
                    }
                }
            }
        }

        if ($errors !== []) {
            throw new HttpException('Validation failed.', 422, $errors);
        }

        return $data;
    }
}
