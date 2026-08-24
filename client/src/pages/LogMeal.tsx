/**
 * Hawker Market Journal style: a mobile first meal entry flow using calm paper cards,
 * large tap controls, supportive language, and temporary photo handling only.
 */
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/BottomNavigation";
import { startLogin } from "@/const";
import { useCloudFoods } from "@/hooks/useCloudFoods";
import { useMealCloudSync } from "@/hooks/useMealCloudSync";
import {
  CameraAccessError,
  deleteTemporaryPhoto,
  getMealPhotoFileError,
  prepareMealPhoto,
  requestCameraPreview,
  stopCameraPreview,
} from "@/lib/cameraService";
import { Food } from "@/lib/foodDatabase";
import { addMealLog, readMealLogs } from "@/lib/mealHistoryService";
import { evaluateNewAchievements } from "@/lib/positiveLearning";
import { trpc } from "@/lib/trpc";
import {
  MAX_ENTRY_SERVINGS,
  MEAL_ENTRY_OPTIONS,
  PHOTO_CAPTURE_NEXT_MODE,
  MIN_ENTRY_SERVINGS,
  UNCLEAR_PHOTO_ACTIONS,
  UNCLEAR_PHOTO_MESSAGE,
  UNSUPPORTED_MEAL_MESSAGE,
  findSupportedFood,
  getPrototypeRecognition,
  searchSupportedFoods,
  validateEntryServings,
} from "@/lib/mealEntryUtils";
import { calculateTotalCarbonFootprint, formatCarbonFootprint } from "@/lib/mealFootprint";
import { Camera, Check, ChevronLeft, ImageUp, Leaf, LoaderCircle, PencilLine, RefreshCw, Search, Sparkles, Trash2, Upload, X } from "lucide-react";
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type LogMode = "choose" | "camera" | "preparing" | "scanning" | "review" | "manual";
type ImageQuality = "clear" | "limited" | "not-a-meal";
type PhotoRecognitionResult =
  | { status: "matched"; confidence: number; imageQuality: ImageQuality; recognisedMeal: Food; ingredients: string[]; matchExplanation: string; reviewNote: string }
  | { status: "unclear"; confidence: number; imageQuality: ImageQuality; candidateName: string; ingredients: string[]; matchExplanation: string; reviewNote: string };
const [cameraOptionLabel, manualOptionLabel] = MEAL_ENTRY_OPTIONS;
const [retakePhotoLabel, enterManuallyLabel] = UNCLEAR_PHOTO_ACTIONS;

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="pt-8">
      <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#4a8058]"><span className="h-px w-7 bg-[#80ad76]" />{eyebrow}</p>
      <h1 className="font-display max-w-[12ch] text-5xl leading-[0.9] tracking-[-0.065em] text-[#143b2c]">{title}</h1>
      <p className="mt-5 max-w-md text-[1rem] leading-7 text-[#567061]">{text}</p>
    </section>
  );
}

function FoodSelector({ value, onChange, catalog, label = "Supported dish" }: { value: string; onChange: (id: string) => void; catalog: Food[]; label?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-13 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-base font-bold text-[#214b35] outline-none transition focus-visible:ring-2 focus-visible:ring-[#2c7049]">
        <option value="">Select a supported dish</option>
        {catalog.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
      </select>
    </label>
  );
}

function ServingInput({ value, onChange, error }: { value: number; onChange: (value: number) => void; error: string | null }) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Serving size</span>
      <input aria-describedby={error ? "serving-error" : undefined} type="number" min={MIN_ENTRY_SERVINGS} max={MAX_ENTRY_SERVINGS} step="1" inputMode="numeric" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 min-h-13 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-base font-bold text-[#214b35] outline-none transition focus-visible:ring-2 focus-visible:ring-[#2c7049]" />
      {error && <p id="serving-error" role="alert" className="mt-2 text-sm font-bold text-[#aa412e]">{error}</p>}
    </label>
  );
}

function EstimateCard({ food, servings }: { food: Food; servings: number }) {
  const total = calculateTotalCarbonFootprint(food.carbonScore, servings);
  return (
    <div className="rounded-[1.5rem] bg-[#1d563a] p-5 text-white shadow-[0_12px_28px_rgba(23,65,47,0.16)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#d5e8c8]">Estimated total</p>
      <p className="font-display mt-1 text-4xl leading-none tracking-[-0.05em]">{formatCarbonFootprint(total)}</p>
      <p className="mt-2 text-sm font-bold text-[#edf5e7]">{food.name} at {servings} {servings === 1 ? "serving" : "servings"}</p>
      <p className="mt-1 text-xs font-bold text-[#d5e8c8]">{formatCarbonFootprint(food.carbonScore)} per serving</p>
    </div>
  );
}

function PhotoQualityNote({ imageQuality }: { imageQuality: ImageQuality }) {
  const message = imageQuality === "clear" ? "Clear photo. Check the suggestion before saving." : imageQuality === "limited" ? "Some photo details are hard to see. Please check carefully." : "This image does not clearly show a meal.";
  return <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs font-bold leading-5 text-[#785343]"><span className="font-extrabold">Photo check: </span>{message}</p>;
}

export function PhotoRecognitionFallback({ candidateName, imageQuality, ingredients, matchExplanation, reviewNote, onRetake, onManual, onFlexibleEstimate }: { candidateName: string; imageQuality: ImageQuality; ingredients: string[]; matchExplanation: string; reviewNote: string; onRetake: () => void; onManual: () => void; onFlexibleEstimate: () => void }) {
  return (
    <div role="status" className="mt-4 rounded-2xl border border-[#efcabe] bg-[#fff3ee] p-4 text-[#823421]">
      <p className="text-sm font-extrabold leading-6">We could not match this photo to a known dish with enough confidence.</p>
      {candidateName !== "No supported dish identified" && <p className="mt-2 text-sm font-bold leading-6 text-[#9a523d]">Possible dish: {candidateName}</p>}
      {ingredients.length > 0 && <p className="mt-2 text-sm leading-6 text-[#9a523d]">Possible visible ingredients: {ingredients.join(", ")}</p>}
      <p className="mt-2 text-sm leading-6 text-[#9a523d]">{matchExplanation}</p>
      <PhotoQualityNote imageQuality={imageQuality} />
      <p className="mt-2 text-sm leading-6 text-[#9a523d]">{reviewNote}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onRetake} className="min-h-12 rounded-xl bg-[#d57448] px-3 text-sm font-extrabold text-white shadow-[0_3px_0_#a94f31] transition hover:bg-[#bd5b3b] active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5439]"><RefreshCw className="mr-1.5 inline size-4" aria-hidden="true" />{retakePhotoLabel}</button>
        <button type="button" onClick={onManual} className="min-h-12 rounded-xl border border-[#d7bfaf] bg-white px-3 text-sm font-extrabold text-[#78412f] transition hover:bg-[#fff9f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5439]"><PencilLine className="mr-1.5 inline size-4" aria-hidden="true" />{enterManuallyLabel}</button>
      </div>
      <button type="button" onClick={onFlexibleEstimate} className="mt-3 min-h-12 w-full rounded-xl border border-[#d7bfaf] bg-[#fff9f6] px-3 text-sm font-extrabold text-[#78412f] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5439]"><Sparkles className="mr-1.5 inline size-4" aria-hidden="true" />Build a flexible estimate</button>
    </div>
  );
}

export function buildFlexibleEstimatePath(mealName: string, visibleIngredients: string[] = []): string {
  const params = new URLSearchParams({ meal: mealName.trim() || "Custom meal" });
  if (visibleIngredients.length > 0) params.set("ingredients", visibleIngredients.slice(0, 8).join("|"));
  return `/custom-estimate?${params.toString()}`;
}

export default function LogMeal() {
  const [, navigate] = useLocation();
  const { syncLog, isAuthenticated } = useMealCloudSync();
  const { foods } = useCloudFoods();
  const [mode, setMode] = useState<LogMode>("choose");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoRecognition, setPhotoRecognition] = useState<PhotoRecognitionResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [servings, setServings] = useState(1);
  const [manualName, setManualName] = useState("");
  const [manualFoodId, setManualFoodId] = useState("");
  const [dishSearch, setDishSearch] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [mealLocation, setMealLocation] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const photoPreparationRef = useRef(0);
  const { mutate: scanPhoto } = trpc.mealRecognition.scan.useMutation();

  const recognition = useMemo(() => getPrototypeRecognition(description, foods), [description, foods]);
  const reviewFood = selectedFoodId ? foods.find((food) => food.id === selectedFoodId) : photoRecognition?.status === "matched" ? foods.find((food) => food.id === photoRecognition.recognisedMeal.id) : recognition.kind === "match" ? recognition.food : undefined;
  const dishSearchResults = useMemo(() => searchSupportedFoods(dishSearch, foods), [dishSearch, foods]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [stream]);

  useEffect(() => () => stopCameraPreview(stream), [stream]);
  useEffect(() => () => deleteTemporaryPhoto(photoUrl), [photoUrl]);
  useEffect(() => {
    if (mode !== "scanning") return;
    if (!photoDataUrl || !isAuthenticated) {
      setScanError(isAuthenticated ? "We could not prepare this photo for recognition. Please try again or enter the meal manually." : "Please sign in before using photo recognition. You can still enter the meal manually.");
      setMode("review");
      return;
    }

    let cancelled = false;
    scanPhoto({ imageDataUrl: photoDataUrl }, {
      onSuccess: (result) => {
        if (cancelled) return;
        const safeResult = result as PhotoRecognitionResult;
        setPhotoRecognition(safeResult);
        if (safeResult.status === "matched") {
          setSelectedFoodId(safeResult.recognisedMeal.id);
          setDescription(safeResult.recognisedMeal.name);
        }
        window.setTimeout(() => !cancelled && setMode("review"), 550);
      },
      onError: () => {
        if (cancelled) return;
        setScanError("We could not recognise this meal photo. Please check the dish yourself or enter it manually.");
        setMode("review");
      },
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, mode, photoDataUrl, scanPhoto]);

  function clearPhoto() {
    photoPreparationRef.current += 1;
    stopCameraPreview(stream);
    setStream(null);
    setPhotoUrl(null);
    setPhotoDataUrl(null);
    setPhotoRecognition(null);
    setScanError(null);
  }

  function openFlexibleEstimate(mealName: string, visibleIngredients: string[] = []) {
    clearPhoto();
    navigate(buildFlexibleEstimatePath(mealName, visibleIngredients));
  }

  async function beginCamera() {
    clearPhoto();
    setCameraError(null);
    setUploadError(null);
    setMode("camera");
    try {
      const nextStream = await requestCameraPreview();
      setStream(nextStream);
    } catch (error) {
      setCameraError(error instanceof CameraAccessError ? error.message : "We could not start the camera. Please upload a photo or enter the meal manually.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("The camera preview is not ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("We could not capture this photo. Please try again or upload a photo.");
        return;
      }
      stopCameraPreview(stream);
      setStream(null);
      void preparePhotoForRecognition(blob, "camera");
    }, "image/jpeg", 0.88);
  }

  async function preparePhotoForRecognition(file: Blob, source: "camera" | "upload") {
    const requestId = photoPreparationRef.current + 1;
    photoPreparationRef.current = requestId;
    setMode("preparing");
    try {
      const preparedPhoto = await prepareMealPhoto(file);
      if (requestId !== photoPreparationRef.current) {
        deleteTemporaryPhoto(preparedPhoto.photoUrl);
        return;
      }
      setPhotoUrl(preparedPhoto.photoUrl);
      setPhotoDataUrl(preparedPhoto.imageDataUrl);
      setMode(PHOTO_CAPTURE_NEXT_MODE);
    } catch {
      if (requestId !== photoPreparationRef.current) return;
      const message = "We could not prepare this photo. Please try another meal image.";
      source === "camera" ? setCameraError(message) : setUploadError(message);
      setMode("camera");
    }
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const fileError = getMealPhotoFileError(file);
    if (fileError) {
      setUploadError(fileError);
      return;
    }
    clearPhoto();
    setUploadError(null);
    setCameraError(null);
    void preparePhotoForRecognition(file, "upload");
  }

  function saveMeal(food: Food, entryMethod: "camera" | "manual", note?: string) {
    const servingError = validateEntryServings(servings);
    if (servingError) {
      entryMethod === "manual" ? setManualError(servingError) : setCameraError(servingError);
      return;
    }
    const newLog = addMealLog({
      mealId: food.id,
      mealName: food.name,
      carbonFootprintPerServing: food.carbonScore,
      servings,
      category: food.category,
      entryMethod,
      note,
      location: mealLocation,
    });
    syncLog(newLog);
    clearPhoto();
    const newBadges = evaluateNewAchievements(readMealLogs());
    toast.success(newBadges.length ? "Meal added. You unlocked a new learning badge." : "Meal added to Daily History");
    navigate("/history");
  }

  function saveManualEntry() {
    const servingError = validateEntryServings(servings);
    if (servingError) {
      setManualError(servingError);
      return;
    }
    if (!manualName.trim()) {
      setManualError("Please enter a meal name before saving.");
      return;
    }
    const selectedFood = foods.find((food) => food.id === manualFoodId);
    const matchedFood = selectedFood ?? findSupportedFood(manualName, foods);
    if (!matchedFood) {
      setManualError(UNSUPPORTED_MEAL_MESSAGE);
      return;
    }
    saveMeal(matchedFood, "manual", manualNotes);
  }

  function returnToChoices() {
    clearPhoto();
    setCameraError(null);
    setUploadError(null);
    setMode("choose");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f4e8] pb-28 text-[#163c2d]">
      <div className="journal-grain pointer-events-none fixed inset-0 z-0 opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-8 pt-5 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => mode === "choose" ? navigate("/") : returnToChoices()} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#d7e3cb] bg-[#fffdf5] px-4 text-sm font-extrabold text-[#21573a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eaf2df] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><ChevronLeft className="size-4" aria-hidden="true" />{mode === "choose" ? "Back to meals" : "Choose method"}</button>
          <img src="/manus-storage/platefootprint-logo_8cf36295.png" alt="PlateFootprint" className="size-10 rounded-xl bg-[#e5f0d9] object-contain" />
        </header>

        {mode === "choose" && (
          <>
            <SectionTitle eyebrow="Meal journal" title="Log a meal." text="Choose a photo or add your meal details yourself. You will always review the estimate before saving." />
            <section className="mt-7 space-y-4" aria-label="Choose a meal entry method">
              <button type="button" onClick={() => isAuthenticated ? beginCamera() : startLogin()} className="group w-full rounded-[1.75rem] bg-[#1d563a] p-6 text-left text-white shadow-[0_16px_35px_rgba(23,65,47,0.16)] transition hover:-translate-y-1 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c7049]">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[#d6e8c8] text-[#1e593d] shadow-[0_4px_0_#a3c49c]"><Camera className="size-7" aria-hidden="true" /></span>
                <span className="font-display mt-6 block text-4xl leading-none tracking-[-0.055em]">{cameraOptionLabel}</span>
                <span className="mt-3 block max-w-sm text-sm leading-6 text-[#eaf3e3]">{isAuthenticated ? "Use the device camera, then review a matched dish and ingredient check before saving." : "Sign in to use secure photo recognition. You can still enter meals manually."}</span>
              </button>
              <button type="button" onClick={() => { clearPhoto(); setManualError(null); setMode("manual"); }} className="group w-full rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-6 text-left shadow-[0_10px_24px_rgba(36,79,54,0.08)] transition hover:-translate-y-1 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2c7049]">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[#f5dfae] text-[#896019] shadow-[0_4px_0_#e2c170]"><PencilLine className="size-7" aria-hidden="true" /></span>
                <span className="font-display mt-6 block text-4xl leading-none tracking-[-0.055em] text-[#173f2e]">{manualOptionLabel}</span>
                <span className="mt-3 block max-w-sm text-sm leading-6 text-[#5e7465]">Select a supported dish and serving size to create your own estimate.</span>
              </button>
              <button type="button" onClick={() => navigate("/custom-estimate")} className="group w-full rounded-[1.75rem] border border-[#e5d3a9] bg-[#fff8e7] p-6 text-left shadow-[0_10px_24px_rgba(125,93,41,0.08)] transition hover:-translate-y-1 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a86a32]">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[#f5dfae] text-[#896019] shadow-[0_4px_0_#e2c170]"><Sparkles className="size-7" aria-hidden="true" /></span>
                <span className="font-display mt-6 block text-4xl leading-none tracking-[-0.055em] text-[#593f20]">Build a Custom Meal</span>
                <span className="mt-3 block max-w-sm text-sm leading-6 text-[#735d3d]">Estimate any meal using its main ingredients and cooking style.</span>
              </button>
            </section>
          </>
        )}

        {mode === "camera" && (
          <>
            <SectionTitle eyebrow="Photo entry" title="Take your meal photo." text="Camera permission is requested only after you choose this option. You can also upload a photo from your device." />
            <section className="mt-7 overflow-hidden rounded-[1.75rem] bg-[#163c2d] shadow-[0_16px_35px_rgba(23,65,47,0.16)]">
              {photoUrl ? <img src={photoUrl} alt="Captured meal to review" className="aspect-[4/3] w-full object-cover" /> : <video ref={videoRef} aria-label="Camera preview" className="aspect-[4/3] w-full bg-[#102d21] object-cover" muted playsInline autoPlay />}
              <div className="p-4">
                {cameraError && <p role="alert" className="mb-4 rounded-xl bg-[#f9d9d0] px-4 py-3 text-sm font-bold leading-6 text-[#87331f]">{cameraError}</p>}
                {photoUrl ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={beginCamera} className="min-h-12 rounded-xl bg-white/10 px-4 text-sm font-extrabold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><RefreshCw className="mr-2 inline size-4" aria-hidden="true" />Retake</button>
                    <button type="button" onClick={() => setMode("review")} className="min-h-12 rounded-xl bg-[#d6e8c8] px-4 text-sm font-extrabold text-[#1e593d] shadow-[0_3px_0_#a3c49c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Check className="mr-2 inline size-4" aria-hidden="true" />Use Photo</button>
                  </div>
                ) : (
                  <button type="button" onClick={capturePhoto} disabled={!stream} className="min-h-13 w-full rounded-xl bg-[#d6e8c8] px-4 text-base font-extrabold text-[#1e593d] shadow-[0_3px_0_#a3c49c] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Camera className="mr-2 inline size-5" aria-hidden="true" />Capture Photo</button>
                )}
              </div>
            </section>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => uploadInputRef.current?.click()} className="min-h-12 rounded-xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-sm font-extrabold text-[#315f42] transition hover:bg-[#edf5e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><Upload className="mr-2 inline size-4" aria-hidden="true" />Upload</button>
              <button type="button" onClick={() => { clearPhoto(); setMode("manual"); }} className="min-h-12 rounded-xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-sm font-extrabold text-[#315f42] transition hover:bg-[#edf5e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><PencilLine className="mr-2 inline size-4" aria-hidden="true" />Enter Manually</button>
            </div>
            {uploadError && <p role="alert" className="mt-3 text-sm font-bold text-[#aa412e]">{uploadError}</p>}
          </>
        )}

        {mode === "preparing" && (
          <>
            <SectionTitle eyebrow="Photo preparation" title="Getting your photo ready." text="We are resizing the meal image for a clearer temporary check. Your photo is not saved." />
            <section className="relative mt-7 overflow-hidden rounded-[1.75rem] bg-[#143c2d] p-6 text-white shadow-[0_16px_35px_rgba(23,65,47,0.2)]" aria-live="polite">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#d6e8c8] px-3 py-1.5 text-xs font-extrabold text-[#1e593d]"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Preparing image</span>
              <p className="font-display mt-5 text-3xl tracking-[-0.05em]">Keeping the meal details clear.</p>
              <p className="mt-2 text-sm leading-6 text-[#eaf3e3]">You will still check the food, ingredients, and serving size before saving.</p>
            </section>
          </>
        )}

        {mode === "scanning" && (
          <>
            <SectionTitle eyebrow="Photo recognition" title="Checking your meal." text="We are comparing visible food details with the known PlateFootprint dishes. You will review the result before saving." />
            <section className="relative mt-7 overflow-hidden rounded-[1.75rem] bg-[#143c2d] shadow-[0_16px_35px_rgba(23,65,47,0.2)]" aria-live="polite" aria-label="Prototype scan in progress">
              {photoUrl && <img src={photoUrl} alt="Meal photo being scanned" className="aspect-[4/3] w-full object-cover opacity-75" />}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0d392140] via-transparent to-[#0d3922b8]" />
              <div className="photo-scan-line absolute inset-x-5 h-0.5 bg-[#d6e8c8] shadow-[0_0_16px_5px_rgba(214,232,200,0.55)]" aria-hidden="true" />
              <div className="absolute inset-5 rounded-2xl border border-[#d6e8c8]/70" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#d6e8c8] px-3 py-1.5 text-xs font-extrabold text-[#1e593d]"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Checking meal and ingredients</span>
                <p className="font-display mt-4 text-3xl tracking-[-0.05em]">Looking for a known dish.</p>
                <p className="mt-2 text-sm leading-6 text-[#eaf3e3]">This is a prototype suggestion. You can change the dish and serving size before saving.</p>
              </div>
            </section>
          </>
        )}

        {mode === "review" && (
          <>
            <SectionTitle eyebrow="Review photo" title="Check this estimate." text="Photo recognition is a suggestion. Please check the dish, visible ingredients, and serving size before saving." />
            {photoUrl && <img src={photoUrl} alt="Meal photo for review" className="mt-7 aspect-[4/3] w-full rounded-[1.75rem] object-cover shadow-[0_12px_28px_rgba(36,79,54,0.13)]" />}
            <section className="mt-5 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)]">
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Describe the meal</span><input type="text" value={description} onChange={(event) => { setDescription(event.target.value); setSelectedFoodId(""); setPhotoRecognition(null); }} placeholder="Example: Chicken Rice" className="mt-2 min-h-13 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-base font-bold text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]" /></label>
              {photoRecognition?.status === "matched" ? (
                <div role="status" className="mt-4 rounded-2xl border border-[#c9dfc1] bg-[#edf5e8] p-4 text-[#24573a]">
                  <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#4f8055]">Closest database match · {photoRecognition.confidence}% confidence</p>
                  <p className="font-display mt-2 text-3xl tracking-[-0.05em]">{photoRecognition.recognisedMeal.name}</p>
                  <PhotoQualityNote imageQuality={photoRecognition.imageQuality} />
                  {photoRecognition.ingredients.length > 0 && <><p className="mt-4 text-xs font-extrabold uppercase tracking-[0.13em] text-[#5f7f63]">Visible ingredients to check</p><ul className="mt-2 flex flex-wrap gap-2">{photoRecognition.ingredients.map((ingredient) => <li key={ingredient} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#3d6348]">{ingredient}</li>)}</ul></>}
                  <p className="mt-3 text-sm leading-6 text-[#486d52]"><span className="font-extrabold">Why this suggestion: </span>{photoRecognition.matchExplanation}</p>
                  <p className="mt-3 text-sm leading-6 text-[#486d52]">{photoRecognition.reviewNote}</p>
                </div>
              ) : photoRecognition?.status === "unclear" ? (
                <PhotoRecognitionFallback candidateName={photoRecognition.candidateName} imageQuality={photoRecognition.imageQuality} ingredients={photoRecognition.ingredients} matchExplanation={photoRecognition.matchExplanation} reviewNote={photoRecognition.reviewNote} onRetake={beginCamera} onManual={() => { clearPhoto(); setMode("manual"); }} onFlexibleEstimate={() => openFlexibleEstimate(photoRecognition.candidateName, photoRecognition.ingredients)} />
              ) : scanError ? (
                <div role="alert" className="mt-4 rounded-2xl border border-[#efcabe] bg-[#fff3ee] p-4 text-[#823421]"><p className="text-sm font-extrabold leading-6">{scanError}</p>{!isAuthenticated && <button type="button" onClick={startLogin} className="mt-3 min-h-11 rounded-xl bg-[#216442] px-4 text-sm font-extrabold text-white shadow-[0_3px_0_#143e2a]">Sign in to scan</button>}</div>
              ) : recognition.kind === "unclear" ? (
                <div role="status" className="mt-3 rounded-2xl border border-[#efcabe] bg-[#fff3ee] p-4 text-[#823421]">
                  <p className="text-sm font-extrabold leading-6">{recognition.message}</p>
                  <p className="mt-2 text-sm leading-6 text-[#9a523d]">Try a clear photo from above with good lighting, or add the meal details yourself.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button type="button" onClick={beginCamera} className="min-h-12 rounded-xl bg-[#d57448] px-3 text-sm font-extrabold text-white shadow-[0_3px_0_#a94f31] transition hover:bg-[#bd5b3b] active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5439]"><RefreshCw className="mr-1.5 inline size-4" aria-hidden="true" />{retakePhotoLabel}</button>
                    <button type="button" onClick={() => { clearPhoto(); setMode("manual"); }} className="min-h-12 rounded-xl border border-[#d7bfaf] bg-white px-3 text-sm font-extrabold text-[#78412f] transition hover:bg-[#fff9f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5439]"><PencilLine className="mr-1.5 inline size-4" aria-hidden="true" />{enterManuallyLabel}</button>
                  </div>
                </div>
              ) : <p className="mt-3 rounded-xl bg-[#e9f2e2] px-4 py-3 text-sm leading-6 text-[#426553]">{recognition.message}</p>}
              <div className="mt-5 space-y-4">
                <FoodSelector value={selectedFoodId || (photoRecognition?.status === "matched" ? photoRecognition.recognisedMeal.id : recognition.kind === "match" ? recognition.food.id : "")} onChange={setSelectedFoodId} catalog={foods} label="Recognised meal" />
                <ServingInput value={servings} onChange={setServings} error={validateEntryServings(servings)} />
                <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Where did you have it <span className="normal-case tracking-normal">optional and private</span></span><input value={mealLocation} onChange={(event) => setMealLocation(event.target.value)} maxLength={120} placeholder="Example: ITE canteen, home, hawker centre" className="mt-2 min-h-12 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-base font-bold text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]" /><span className="mt-2 block text-xs leading-5 text-[#69806d]">Please do not enter a full address. This place is saved only in your private meal history.</span></label>
              </div>
            </section>
            {reviewFood && validateEntryServings(servings) === null && <div className="mt-5"><EstimateCard food={reviewFood} servings={servings} /></div>}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <button type="button" onClick={beginCamera} className="min-h-12 rounded-xl border border-[#d5e2cd] bg-[#fffdf5] px-2 text-xs font-extrabold text-[#315f42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><RefreshCw className="mr-1 inline size-4" aria-hidden="true" />Retake</button>
              <button type="button" onClick={clearPhoto} className="min-h-12 rounded-xl border border-[#edc3b7] bg-[#fff7f2] px-2 text-xs font-extrabold text-[#9f3c27] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bd5439]"><Trash2 className="mr-1 inline size-4" aria-hidden="true" />Delete</button>
              <button type="button" onClick={() => { clearPhoto(); setMode("manual"); }} className="min-h-12 rounded-xl border border-[#d5e2cd] bg-[#fffdf5] px-2 text-xs font-extrabold text-[#315f42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049]"><PencilLine className="mr-1 inline size-4" aria-hidden="true" />Manual</button>
            </div>
            <Button disabled={!reviewFood || validateEntryServings(servings) !== null} onClick={() => reviewFood && saveMeal(reviewFood, "camera")} className="mt-4 h-13 w-full rounded-2xl bg-[#d57448] text-base font-extrabold text-white shadow-[0_4px_0_#a94f31] transition hover:bg-[#bd5b3b] disabled:cursor-not-allowed disabled:opacity-50">Use Photo and save estimate</Button>
          </>
        )}

        {mode === "manual" && (
          <>
            <SectionTitle eyebrow="Manual entry" title="Add your meal details." text="Choose a supported dish or build a flexible ingredient estimate for any meal." />
            <section className="mt-7 space-y-5 rounded-[1.75rem] border border-[#dce8d1] bg-[#fffdf5] p-5 shadow-[0_10px_24px_rgba(36,79,54,0.08)]">
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Meal name</span><input type="text" value={manualName} onChange={(event) => { setManualName(event.target.value); setManualError(null); }} placeholder="Example: Chicken Rice" className="mt-2 min-h-13 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-base font-bold text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]" /></label>
              <div>
                <label htmlFor="dish-search" className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Find a supported dish</label>
                <div className="relative mt-2">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#568460]" aria-hidden="true" />
                  <input id="dish-search" type="search" role="combobox" aria-expanded="true" aria-controls="dish-search-results" aria-describedby="dish-search-hint" value={dishSearch} onChange={(event) => { setDishSearch(event.target.value); setManualError(null); }} placeholder="Search Chicken Rice, Laksa..." className="min-h-13 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] py-3 pl-12 pr-4 text-base font-bold text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]" />
                </div>
                <p id="dish-search-hint" className="mt-2 text-sm leading-6 text-[#64776a]">Choose a result to use its carbon estimate.</p>
                <div id="dish-search-results" role="listbox" aria-label="Supported dish results" className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-2xl bg-[#f5f2e7] p-2">
                  {dishSearchResults.length > 0 ? dishSearchResults.map((food) => (
                    <button key={food.id} type="button" role="option" aria-selected={manualFoodId === food.id} onClick={() => { setManualFoodId(food.id); setManualName(food.name); setDishSearch(food.name); setManualError(null); }} className={`flex min-h-13 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7049] ${manualFoodId === food.id ? "bg-[#dcebd4] text-[#1e593d]" : "bg-white text-[#315f42] hover:bg-[#eaf2df]"}`}>
                      <span><span className="block font-extrabold">{food.name}</span><span className="mt-0.5 block text-xs font-bold text-[#697d6d]">{food.category}</span></span>
                      <span className="text-sm font-extrabold">{food.carbonScore.toFixed(2)} kg CO2e</span>
                    </button>
                  )) : <p className="px-4 py-5 text-sm font-bold leading-6 text-[#7d5d50]">No supported dishes match this search. You can still build a flexible ingredient estimate below.</p>}
                </div>
              </div>
              <ServingInput value={servings} onChange={(value) => { setServings(value); setManualError(null); }} error={validateEntryServings(servings)} />
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Where did you have it <span className="normal-case tracking-normal">optional and private</span></span><input value={mealLocation} onChange={(event) => setMealLocation(event.target.value)} maxLength={120} placeholder="Example: ITE canteen, home, hawker centre" className="mt-2 min-h-13 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] px-4 text-base font-bold text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]" /><span className="mt-2 block text-xs leading-5 text-[#69806d]">Please do not enter a full address. This place is saved only in your private meal history.</span></label>
              <label className="block"><span className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a865c]">Notes <span className="normal-case tracking-normal">optional</span></span><textarea value={manualNotes} onChange={(event) => setManualNotes(event.target.value)} placeholder="Example: Less rice, extra vegetables" rows={3} className="mt-2 w-full rounded-2xl border border-[#d5e2cd] bg-[#fffdf5] px-4 py-3 text-base text-[#214b35] outline-none focus-visible:ring-2 focus-visible:ring-[#2c7049]" /></label>
              {manualError && <p role="alert" className="rounded-xl bg-[#fff0ea] px-4 py-3 text-sm font-bold leading-6 text-[#8a3c29]">{manualError}</p>}
            </section>
            {(() => { const food = foods.find((item) => item.id === manualFoodId) ?? findSupportedFood(manualName, foods); return food && validateEntryServings(servings) === null ? <div className="mt-5"><EstimateCard food={food} servings={servings} /></div> : null; })()}
            <Button onClick={saveManualEntry} className="mt-5 h-13 w-full rounded-2xl bg-[#216442] text-base font-extrabold text-white shadow-[0_4px_0_#143e2a] transition hover:bg-[#184d32] active:translate-y-0.5 active:shadow-[0_2px_0_#143e2a]">Save supported meal</Button>
            <button type="button" onClick={() => { const flexibleMealName = manualName.trim() || dishSearch.trim(); if (!flexibleMealName) { setManualError("Please enter a meal name to build a flexible estimate."); return; } openFlexibleEstimate(flexibleMealName); }} className="mt-3 min-h-13 w-full rounded-2xl border border-[#d7b198] bg-[#fff8ed] px-4 text-base font-extrabold text-[#72452f] shadow-sm transition hover:bg-[#fffdf5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a86a32]"><Sparkles className="mr-2 inline size-5" aria-hidden="true" />Build flexible estimate for this meal</button>
          </>
        )}

        <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" aria-label="Upload meal photo" />
      </div>
      <BottomNavigation />
    </main>
  );
}
