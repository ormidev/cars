"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Account, createAccount, deleteAccount, getAccounts, updateAccount } from "@/lib/accounts";
import PwaInstall from "@/app/pwa-install";
import ThemeToggle from "@/app/theme-toggle";

type IconName = "plus" | "wallet" | "cards" | "arrow" | "close";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    plus: <path d="M12 5v14M5 12h14" />,
    wallet: <><path d="M4 6.5h14A2.5 2.5 0 0 1 20.5 9v9A2.5 2.5 0 0 1 18 20.5H4A2.5 2.5 0 0 1 1.5 18V6A2.5 2.5 0 0 1 4 3.5h12" /><path d="M15 11h5.5v5H15a2.5 2.5 0 0 1 0-5Z" /></>,
    cards: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
  };

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

type CropSettings = { zoom: number; x: number; y: number };

function drawCroppedImage(context: CanvasRenderingContext2D, image: HTMLImageElement, crop: CropSettings, width: number, height: number) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * crop.zoom;
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  const offsetX = -(drawnWidth - width) * (crop.x / 100);
  const offsetY = -(drawnHeight - height) * (crop.y / 100);
  context.drawImage(image, offsetX, offsetY, drawnWidth, drawnHeight);
}

async function prepareCarImage(source: File | string, crop: CropSettings): Promise<string> {
  if (source instanceof File && !source.type.startsWith("image/")) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (source instanceof File && source.size > 5 * 1024 * 1024) throw new Error("The car image must be smaller than 5 MB.");

  const objectUrl = source instanceof File ? URL.createObjectURL(source) : source;
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const width = 600;
    const height = 650;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");

    drawCroppedImage(context, image, crop, width, height);

    for (const quality of [0.78, 0.64, 0.5]) {
      const result = canvas.toDataURL("image/jpeg", quality);
      if (result.length <= 400000) return result;
    }
    throw new Error("The compressed image is still too large. Choose a smaller photo.");
  } finally {
    if (source instanceof File) URL.revokeObjectURL(objectUrl);
  }
}

function PhotoCropper({ source, crop, onCropChange, onCancel, onSave, saving }: {
  source: string;
  crop: CropSettings;
  onCropChange: (crop: CropSettings) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageReady, setImageReady] = useState(0);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setImageReady((value) => value + 1);
    };
    image.src = source;
    return () => { imageRef.current = null; };
  }, [source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || imageReady === 0) return;
    const context = canvas.getContext("2d");
    if (context) drawCroppedImage(context, image, crop, canvas.width, canvas.height);
  }, [crop, imageReady]);

  return (
    <div className="modal-scrim crop-scrim" role="presentation">
      <div className="crop-dialog" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <div className="modal-head"><div><p className="eyebrow">CAR PHOTO</p><h2 id="crop-title">Adjust the visible area</h2></div><button type="button" onClick={onCancel} aria-label="Close crop editor"><Icon name="close" /></button></div>
        <p className="modal-intro">Position and zoom the image exactly as it will appear on the card.</p>
        <div className="crop-card-preview"><canvas ref={canvasRef} width="360" height="390" /></div>
        <div className="crop-controls">
          <label>Zoom<input type="range" min="1" max="2.5" step="0.05" value={crop.zoom} onChange={(event) => onCropChange({ ...crop, zoom: Number(event.target.value) })} /></label>
          <label>Horizontal position<input type="range" min="0" max="100" value={crop.x} onChange={(event) => onCropChange({ ...crop, x: Number(event.target.value) })} /></label>
          <label>Vertical position<input type="range" min="0" max="100" value={crop.y} onChange={(event) => onCropChange({ ...crop, y: Number(event.target.value) })} /></label>
        </div>
        <div className="confirm-actions"><button type="button" onClick={onCancel} disabled={saving}>Cancel</button><button className="save-crop-button" type="button" onClick={onSave} disabled={saving}>{saving ? "Preparing..." : "Use this crop"}</button></div>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, onEdit, onDelete }: { vehicle: Account; onEdit: (vehicle: Account) => void; onDelete: (vehicle: Account) => void }) {
  const [flipped, setFlipped] = useState(false);
  const accountCount = Number(Boolean(vehicle.easytripAccount)) + Number(Boolean(vehicle.autosweepAccount));

  return (
    <div className={`pass-card ${flipped ? "is-flipped" : ""}`} role="button" tabIndex={0} onClick={(event) => {
      if ((event.target as HTMLElement).closest("button")) return;
      setFlipped((value) => !value);
    }} onKeyDown={(event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setFlipped((value) => !value);
      }
    }} aria-label={`${flipped ? "Hide" : "Show"} ${vehicle.vehicle} RFID accounts`} aria-pressed={flipped}>
      <span className="pass-card__inner">
        <span className="pass-face pass-front">
          <span className="card-orbit orbit-one" /><span className="card-orbit orbit-two" />
          {vehicle.imageUrl && <span className="car-photo" style={{ backgroundImage: `url(${vehicle.imageUrl})` }} aria-hidden="true" />}
          <span className="card-topline">
            <span className="provider-mark">{vehicle.vehicle.slice(0, 1).toUpperCase()}</span>
            <span className="card-labels"><strong>{vehicle.vehicle}</strong><small>{vehicle.plateNumber || "No plate number"}</small></span>
            <span className="status"><i /> {accountCount} linked</span>
          </span>
          <span className="balance-label">RFID accounts</span>
          <span className="provider-pills">
            {vehicle.easytripAccount && <span>Easytrip</span>}
            {vehicle.autosweepAccount && <span>Autosweep</span>}
          </span>
          <span className="card-bottomline"><span><small>Vehicle</small><strong>{vehicle.vehicle.toUpperCase()}</strong></span><span className="tap-hint">Tap to flip <Icon name="arrow" size={16} /></span></span>
        </span>

        <span className="pass-face pass-back">
          <span className="details-head"><span><small>{vehicle.vehicle}</small><strong>RFID account numbers</strong></span><span className="flip-back">Flip back <Icon name="arrow" size={15} /></span></span>
          <span className="account-list">
            <span className="account-row"><span className="account-logo easytrip-logo">E</span><span><small>Easytrip</small><strong>{vehicle.easytripAccount || "Not linked"}</strong></span></span>
            <span className="account-row"><span className="account-logo autosweep-logo">A</span><span><small>Autosweep</small><strong>{vehicle.autosweepAccount || "Not linked"}</strong></span></span>
          </span>
          <span className="card-actions">
            <button className="edit-card-button" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onEdit(vehicle); }}>Edit</button>
            <button className="delete-card-button" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onDelete(vehicle); }}>Delete</button>
          </span>
        </span>
      </span>
    </div>
  );
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Account | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoSource, setPhotoSource] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [crop, setCrop] = useState<CropSettings>({ zoom: 1, x: 50, y: 50 });
  const [cropSaving, setCropSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setVehicles(await getAccounts());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load your vehicles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getAccounts(controller.signal)
      .then((accounts) => setVehicles(accounts))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "Could not load your vehicles.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function openAddModal() {
    setEditingTarget(null);
    setPhotoPreview("");
    setPhotoSource("");
    setPhotoFile(null);
    setCrop({ zoom: 1, x: 50, y: 50 });
    setSaveError("");
    setModalOpen(true);
  }

  function openEditModal(vehicle: Account) {
    setEditingTarget(vehicle);
    setPhotoPreview(vehicle.imageUrl || "");
    setPhotoSource(vehicle.imageUrl || "");
    setPhotoFile(null);
    setCrop({ zoom: 1, x: 50, y: 50 });
    setSaveError("");
    setModalOpen(true);
  }

  async function saveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const vehicle = String(data.get("vehicle") || "").trim();
    const plateNumber = String(data.get("plateNumber") || "").trim().toUpperCase() || null;
    const easytripAccount = String(data.get("easytripAccount") || "").trim() || null;
    const autosweepAccount = String(data.get("autosweepAccount") || "").trim() || null;

    if (!easytripAccount && !autosweepAccount) {
      setSaveError("Enter at least one RFID account number.");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      const imageUrl = photoPreview || null;
      const input = { vehicle, plateNumber, easytripAccount, autosweepAccount, imageUrl };
      if (editingTarget) {
        const updated = await updateAccount(editingTarget.id, input);
        setVehicles((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await createAccount(input);
        setVehicles((current) => [...current, created]);
      }
      setModalOpen(false);
      setEditingTarget(null);
      setPhotoPreview("");
      setPhotoSource("");
      setPhotoFile(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the vehicle.");
    } finally {
      setSaving(false);
    }
  }

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("The car image must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoFile(file);
      setPhotoSource(String(reader.result || ""));
      setCrop({ zoom: 1, x: 50, y: 50 });
      setPhotoEditorOpen(true);
      setSaveError("");
    };
    reader.readAsDataURL(file);
  }

  async function savePhotoCrop() {
    const source = photoFile || photoSource;
    if (!source) return;
    setCropSaving(true);
    try {
      setPhotoPreview(await prepareCarImage(source, crop));
      setPhotoEditorOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not prepare the photo.");
      setPhotoEditorOpen(false);
    } finally {
      setCropSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(deleteTarget.id);
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete the vehicle.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="content" id="vehicles">
        <header className="mobile-header">
          <div className="brand"><span className="brand-mark"><Icon name="wallet" size={20} /></span><span><strong>Car Accounts</strong><small>RFID wallet</small></span></div>
          <div className="header-actions"><PwaInstall /><ThemeToggle /></div>
        </header>

        <div className="welcome-row">
          <div><p className="eyebrow">YOUR RFID WALLET</p><h1>Kotse,<br />all in one place.</h1><p className="intro">Keep each vehicle&apos;s Easytrip and Autosweep account numbers together. Tap a card to reveal them.</p></div>
          <button className="add-button add-button--desktop" onClick={openAddModal}><Icon name="plus" size={19} /> Add vehicle</button>
        </div>

        <section className="summary" aria-label="Vehicle summary">
          <span className="summary-glow" />
          <div className="summary-copy"><small>Linked vehicles</small><div><strong>{vehicles.length}</strong></div><p>Easytrip and Autosweep account directory</p></div>
          <div className="summary-art"><span /><span /><span /></div>
        </section>

        <div className="section-title"><div><h2>Your vehicles</h2><p>Tap any card to view its RFID accounts.</p></div><button className="add-button add-button--mobile" onClick={openAddModal}><Icon name="plus" size={18} /> Add</button></div>
        {loading ? (
          <div className="cards-grid" aria-label="Loading vehicles"><div className="card-skeleton" /><div className="card-skeleton" /></div>
        ) : loadError ? (
          <div className="empty-state empty-state--error"><span>!</span><h3>Accounts unavailable</h3><p>{loadError}</p><button onClick={() => void loadVehicles()}>Try again</button></div>
        ) : vehicles.length === 0 ? (
          <div className="empty-state"><span><Icon name="cards" size={26} /></span><h3>No vehicles added yet</h3><p>Add your first vehicle and its Easytrip or Autosweep account number.</p><button onClick={openAddModal}>Add your first vehicle</button></div>
        ) : (
          <div className="cards-grid">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={openEditModal} onDelete={(selected) => { setDeleteError(""); setDeleteTarget(selected); }} />)}</div>
        )}
      </section>

      {modalOpen && (
        <div className="modal-scrim" role="presentation" onMouseDown={() => setModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><div><p className="eyebrow">{editingTarget ? "EDIT VEHICLE" : "NEW VEHICLE"}</p><h2 id="modal-title">{editingTarget ? `Edit ${editingTarget.vehicle}` : "Add a vehicle"}</h2></div><button onClick={() => setModalOpen(false)} aria-label="Close"><Icon name="close" /></button></div>
            <p className="modal-intro">{editingTarget ? "Update the vehicle, plate number, RFID accounts, or car photo." : "Add the vehicle details and either one or both RFID account numbers."}</p>
            <form key={editingTarget?.id || "new"} onSubmit={saveVehicle}>
              <div className="form-row"><label>Vehicle<input name="vehicle" placeholder="e.g. Avanza" defaultValue={editingTarget?.vehicle || ""} required /></label><label>Plate number<input name="plateNumber" placeholder="e.g. ABC 1234" defaultValue={editingTarget?.plateNumber || ""} maxLength={20} /></label></div>
              <div className="form-row"><label>Easytrip account<input name="easytripAccount" placeholder="e.g. 520018920443" inputMode="numeric" defaultValue={editingTarget?.easytripAccount || ""} /></label><label>Autosweep account<input name="autosweepAccount" placeholder="e.g. 2128807" inputMode="numeric" defaultValue={editingTarget?.autosweepAccount || ""} /></label></div>
              <div className="photo-control"><label className="photo-field">Car photo <span className={`photo-upload ${photoPreview ? "has-preview" : ""}`} style={photoPreview ? { backgroundImage: `url(${photoPreview})` } : undefined}><input name="carImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.currentTarget.files?.[0])} /><span>{photoPreview ? "Change photo" : "+ Choose a car photo"}</span><small>JPG, PNG or WebP · maximum 5 MB</small></span></label>{photoPreview && <span className="photo-edit-actions"><button className="edit-crop-button" type="button" onClick={() => setPhotoEditorOpen(true)}>Adjust visible area</button><button className="remove-photo-button" type="button" onClick={() => { setPhotoPreview(""); setPhotoSource(""); setPhotoFile(null); }}>Remove photo</button></span>}</div>
              {saveError && <p className="form-error" role="alert">{saveError}</p>}
              <button className="submit-button" type="submit" disabled={saving}>{saving ? "Saving..." : editingTarget ? "Save changes" : "Add vehicle"} {!saving && <Icon name="arrow" size={18} />}</button>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-scrim" role="presentation" onMouseDown={() => !deleting && setDeleteTarget(null)}>
          <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" onMouseDown={(event) => event.stopPropagation()}>
            <span className="confirm-icon">!</span>
            <h2 id="delete-title">Delete {deleteTarget.vehicle}?</h2>
            <p id="delete-description">This will permanently remove the vehicle and its RFID account numbers. This action cannot be undone.</p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="confirm-actions">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="danger-button" type="button" onClick={() => void confirmDelete()} disabled={deleting}>{deleting ? "Deleting..." : "Delete vehicle"}</button>
            </div>
          </div>
        </div>
      )}

      {photoEditorOpen && photoSource && (
        <PhotoCropper source={photoSource} crop={crop} onCropChange={setCrop} onCancel={() => setPhotoEditorOpen(false)} onSave={() => void savePhotoCrop()} saving={cropSaving} />
      )}
    </main>
  );
}
