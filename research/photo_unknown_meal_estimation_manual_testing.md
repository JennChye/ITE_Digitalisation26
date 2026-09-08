# Unknown Meal Photo Estimation Manual Test

## Purpose

This flow lets a student use the camera or upload a meal image even when the dish is not already in the PlateFootprint catalogue.

## Expected flow

1. Sign in and choose **Take a Photo**.
2. Capture or upload a clear meal image.
3. Review the possible dish name, confidence, image quality, and visible ingredients.
4. Edit an ingredient, remove an ingredient, or add an ingredient before continuing.
5. Review the suggested carbon estimate. The estimate is based on editable starting assumptions, not a confirmed dish value.
6. Open the flexible estimator and check protein, rice or noodle base, ingredient amounts, cooking method, and serving size.
7. Review the contribution source labels before saving.
8. Save only after the student accepts the assumptions.

## Source and uncertainty checks

The flexible estimate uses multiple factor sources. Rice uses the mapped Ecosperity Singapore food impact report factor in the current estimator. Other ingredients use the labelled Singapore IPUR example or global factor data, and cooking energy is clearly marked as a prototype assumption. The Ecosperity report is a life cycle study and does not provide an exact value for every plated recipe. The interface must therefore retain uncertainty language and must not present the result as an exact dish footprint.

## Privacy checks

Photos remain temporary during review and are deleted when the flow is cleared or completed. The image recognition call is server side. No image is added to community posts, leaderboards, badges, reflections, or favourite meal places. Only the student reviewed meal estimate is saved to private history if the student chooses to save it.

## Recovery checks

An unclear or non meal image must show retake and manual entry actions. A student must be able to leave without saving. If recognition fails, the existing manual and flexible estimate paths remain available.
