"""Function calling tools definition for Gemini AI."""

from google.genai import types

# Tool definitions for Gemini function calling
TOOL_DEFINITIONS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="client_lookup",
                description="Mencari data pelanggan berdasarkan email. Gunakan ini untuk mengecek apakah pelanggan sudah terdaftar.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "email": types.Schema(
                            type=types.Type.STRING,
                            description="Email pelanggan yang akan dicari"
                        )
                    },
                    required=["email"]
                )
            ),
            types.FunctionDeclaration(
                name="create_client",
                description="Membuat data pelanggan baru. Gunakan ini saat pelanggan belum terdaftar.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "name": types.Schema(
                            type=types.Type.STRING,
                            description="Nama lengkap pelanggan"
                        ),
                        "email": types.Schema(
                            type=types.Type.STRING,
                            description="Email pelanggan"
                        ),
                        "phone": types.Schema(
                            type=types.Type.STRING,
                            description="Nomor telepon pelanggan"
                        )
                    },
                    required=["name", "email", "phone"]
                )
            ),
            types.FunctionDeclaration(
                name="check_availability",
                description="Mengecek ketersediaan waktu untuk reservasi. Gunakan ini sebelum melakukan booking.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "startTime": types.Schema(
                            type=types.Type.STRING,
                            description="Waktu mulai dalam format ISO 8601 (contoh: 2024-01-15T19:00:00)"
                        ),
                        "endTime": types.Schema(
                            type=types.Type.STRING,
                            description="Waktu selesai dalam format ISO 8601 (contoh: 2024-01-15T21:00:00)"
                        )
                    },
                    required=["startTime", "endTime"]
                )
            ),
            types.FunctionDeclaration(
                name="book_event",
                description="Membuat reservasi baru untuk pelanggan. Pastikan sudah cek ketersediaan terlebih dahulu.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "name": types.Schema(
                            type=types.Type.STRING,
                            description="Nama pelanggan untuk reservasi"
                        ),
                        "email": types.Schema(
                            type=types.Type.STRING,
                            description="Email pelanggan"
                        ),
                        "startTime": types.Schema(
                            type=types.Type.STRING,
                            description="Waktu mulai reservasi dalam format ISO 8601"
                        ),
                        "endTime": types.Schema(
                            type=types.Type.STRING,
                            description="Waktu selesai reservasi dalam format ISO 8601"
                        )
                    },
                    required=["name", "email", "startTime", "endTime"]
                )
            ),
            types.FunctionDeclaration(
                name="lookup_appointment",
                description="Mencari reservasi yang sudah ada berdasarkan email pelanggan.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "email": types.Schema(
                            type=types.Type.STRING,
                            description="Email pelanggan untuk mencari reservasi"
                        )
                    },
                    required=["email"]
                )
            ),
            types.FunctionDeclaration(
                name="reschedule_appointment",
                description="Mengubah jadwal reservasi yang sudah ada.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "email": types.Schema(
                            type=types.Type.STRING,
                            description="Email pelanggan"
                        ),
                        "newStartTime": types.Schema(
                            type=types.Type.STRING,
                            description="Waktu mulai baru dalam format ISO 8601"
                        ),
                        "newEndTime": types.Schema(
                            type=types.Type.STRING,
                            description="Waktu selesai baru dalam format ISO 8601"
                        ),
                        "event_id": types.Schema(
                            type=types.Type.STRING,
                            description="ID reservasi yang akan diubah"
                        )
                    },
                    required=["email", "newStartTime", "newEndTime", "event_id"]
                )
            ),
            types.FunctionDeclaration(
                name="cancel_appointment",
                description="Membatalkan reservasi yang sudah ada.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "email": types.Schema(
                            type=types.Type.STRING,
                            description="Email pelanggan"
                        ),
                        "event_id": types.Schema(
                            type=types.Type.STRING,
                            description="ID reservasi yang akan dibatalkan"
                        )
                    },
                    required=["email", "event_id"]
                )
            ),
            types.FunctionDeclaration(
                name="grant_access",
                description="Membuka akses pintu/lift untuk tamu yang sudah terverifikasi.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "visitor_name": types.Schema(
                            type=types.Type.STRING,
                            description="Nama tamu yang diberi akses"
                        ),
                        "zone": types.Schema(
                            type=types.Type.STRING,
                            description="Area akses (contoh: Lift Tamu, Pintu Utama)"
                        )
                    },
                    required=["visitor_name", "zone"]
                )
            ),
            types.FunctionDeclaration(
                name="check_in_guest",
                description="Mencatat kehadiran tamu di sistem buku tamu.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "name": types.Schema(
                            type=types.Type.STRING,
                            description="Nama tamu"
                        ),
                        "booking_id": types.Schema(
                            type=types.Type.STRING,
                            description="ID Booking (opsional jika walk-in)"
                        )
                    },
                    required=["name"]
                )
            ),
            types.FunctionDeclaration(
                name="trigger_ui_action",
                description="Memicu aksi visual pada layar Kiosk (seperti animasi scan, flash kamera, dll). Gunakan ini saat melakukan verifikasi biometrik.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "action": types.Schema(
                            type=types.Type.STRING,
                            description="Jenis aksi: 'scan_face', 'scan_id', 'flash', 'approve', 'reject'"
                        ),
                        "message": types.Schema(
                            type=types.Type.STRING,
                            description="Pesan yang ditampilkan di layar"
                        )
                    },
                    required=["action", "message"]
                )
            )
        ]
    )
]


def get_tool_declarations():
    """Return the list of tool definitions for Gemini."""
    return TOOL_DEFINITIONS
