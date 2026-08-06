"use client";

import React from "react";

type DangerZoneProps = {
  onOpenDeleteModal: () => void;
};

export default function DangerZone({ onOpenDeleteModal }: DangerZoneProps) {
  return (
    <div style={{ width: "100%", maxWidth: "900px", marginTop: "1rem" }}>
      <section className="settings-section w-full md:bg-[#111] md:border md:border-red-500/20 md:rounded-xl md:p-4 border border-red-500/20 rounded-xl p-4 bg-red-500/5 md:mb-0 mb-12">
        <div className="flex md:items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <h2 className="settings-section-title text-red-500 m-0">
              Danger Zone
            </h2>
            <p className="text-gray-400 text-xs mt-1 max-w-md">
              Once you delete your account, there is no going back. All data
              will be permanently removed.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDeleteModal}
            className="rounded-md bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium text-sm whitespace-nowrap"
            style={{ padding: "0.5rem 1rem" }}>
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
