export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      abteilung_members: {
        Row: {
          abteilung_id: string;
          benachrichtigen: boolean;
          created_at: string;
          role: Database["public"]["Enums"]["member_role"];
          source: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          abteilung_id: string;
          benachrichtigen?: boolean;
          created_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          source?: string;
          user_id: string;
        };
        Update: {
          abteilung_id?: string;
          benachrichtigen?: boolean;
          created_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          source?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "abteilung_members_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "abteilung_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      abteilungen: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          logo_url: string | null;
          midata_group_id: number | null;
          name: string;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          midata_group_id?: number | null;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          logo_url?: string | null;
          midata_group_id?: number | null;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          abteilung_id: string | null;
          aktion: string;
          alt: Json | null;
          created_at: string;
          datensatz_id: string | null;
          id: number;
          neu: Json | null;
          tabelle: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          abteilung_id?: string | null;
          aktion: string;
          alt?: Json | null;
          created_at?: string;
          datensatz_id?: string | null;
          id?: number;
          neu?: Json | null;
          tabelle: string;
          user_id?: string | null;
        };
        Update: {
          abteilung_id?: string | null;
          aktion?: string;
          alt?: Json | null;
          created_at?: string;
          datensatz_id?: string | null;
          id?: number;
          neu?: Json | null;
          tabelle?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      bestellung_historie: {
        Row: {
          bestellung_id: number;
          created_at: string;
          id: number;
          text: string | null;
          typ: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          bestellung_id: number;
          created_at?: string;
          id?: number;
          text?: string | null;
          typ: string;
          user_id?: string | null;
        };
        Update: {
          bestellung_id?: number;
          created_at?: string;
          id?: number;
          text?: string | null;
          typ?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bestellung_historie_bestellung_id_fkey";
            columns: ["bestellung_id"];
            isOneToOne: false;
            referencedRelation: "bestellungen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bestellung_historie_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bestellung_items: {
        Row: {
          anzahl: number;
          bestellung_id: number;
          controlled: boolean;
          material_id: number;
          prepared: boolean;
        };
        ComputedFields: never;
        Insert: {
          anzahl: number;
          bestellung_id: number;
          controlled?: boolean;
          material_id: number;
          prepared?: boolean;
        };
        Update: {
          anzahl?: number;
          bestellung_id?: number;
          controlled?: boolean;
          material_id?: number;
          prepared?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "bestellung_items_bestellung_id_fkey";
            columns: ["bestellung_id"];
            isOneToOne: false;
            referencedRelation: "bestellungen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bestellung_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "material";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bestellung_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "material_unter_min";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bestellung_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "stat_material";
            referencedColumns: ["material_id"];
          },
        ];
      };
      bestellungen: {
        Row: {
          ablehnungsgrund: string | null;
          abteilung_id: string;
          anlass_id: number | null;
          besteller_id: string | null;
          bis: string;
          created_at: string;
          erinnerung_gesendet_at: string | null;
          gruppe_freitext: string | null;
          id: number;
          kommentar: string | null;
          matchef_kommentar: string | null;
          status: Database["public"]["Enums"]["bestellung_status"];
          stufe_id: number | null;
          updated_at: string;
          von: string;
        };
        ComputedFields: never;
        Insert: {
          ablehnungsgrund?: string | null;
          abteilung_id: string;
          anlass_id?: number | null;
          besteller_id?: string | null;
          bis: string;
          created_at?: string;
          erinnerung_gesendet_at?: string | null;
          gruppe_freitext?: string | null;
          id?: number;
          kommentar?: string | null;
          matchef_kommentar?: string | null;
          status?: Database["public"]["Enums"]["bestellung_status"];
          stufe_id?: number | null;
          updated_at?: string;
          von: string;
        };
        Update: {
          ablehnungsgrund?: string | null;
          abteilung_id?: string;
          anlass_id?: number | null;
          besteller_id?: string | null;
          bis?: string;
          created_at?: string;
          erinnerung_gesendet_at?: string | null;
          gruppe_freitext?: string | null;
          id?: number;
          kommentar?: string | null;
          matchef_kommentar?: string | null;
          status?: Database["public"]["Enums"]["bestellung_status"];
          stufe_id?: number | null;
          updated_at?: string;
          von?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bestellungen_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bestellungen_anlass_id_fkey";
            columns: ["anlass_id"];
            isOneToOne: false;
            referencedRelation: "gruppen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bestellungen_besteller_id_fkey";
            columns: ["besteller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bestellungen_stufe_id_fkey";
            columns: ["stufe_id"];
            isOneToOne: false;
            referencedRelation: "gruppen";
            referencedColumns: ["id"];
          },
        ];
      };
      gruppen: {
        Row: {
          abteilung_id: string;
          aktiv: boolean;
          id: number;
          name: string;
          typ: Database["public"]["Enums"]["gruppe_typ"];
        };
        ComputedFields: never;
        Insert: {
          abteilung_id: string;
          aktiv?: boolean;
          id?: number;
          name: string;
          typ?: Database["public"]["Enums"]["gruppe_typ"];
        };
        Update: {
          abteilung_id?: string;
          aktiv?: boolean;
          id?: number;
          name?: string;
          typ?: Database["public"]["Enums"]["gruppe_typ"];
        };
        Relationships: [
          {
            foreignKeyName: "gruppen_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
      ical_tokens: {
        Row: {
          token: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          token?: string;
          user_id: string;
        };
        Update: {
          token?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ical_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      kategorien: {
        Row: {
          abteilung_id: string;
          id: number;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          abteilung_id: string;
          id?: number;
          name: string;
        };
        Update: {
          abteilung_id?: string;
          id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kategorien_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
      material: {
        Row: {
          abteilung_id: string;
          anzahl: number;
          archiviert: boolean;
          beschreibung: string | null;
          consumable: boolean;
          created_at: string;
          damaged: number;
          gewicht_kg: number | null;
          id: number;
          image_urls: string[];
          inventarnummer: string | null;
          kaufdatum: string | null;
          kaufpreis: number | null;
          lost: number;
          min_bestand: number | null;
          name: string;
          only_internal: boolean;
          standort_id: number | null;
          updated_at: string;
          zustand: Database["public"]["Enums"]["material_zustand"] | null;
        };
        ComputedFields: never;
        Insert: {
          abteilung_id: string;
          anzahl?: number;
          archiviert?: boolean;
          beschreibung?: string | null;
          consumable?: boolean;
          created_at?: string;
          damaged?: number;
          gewicht_kg?: number | null;
          id?: number;
          image_urls?: string[];
          inventarnummer?: string | null;
          kaufdatum?: string | null;
          kaufpreis?: number | null;
          lost?: number;
          min_bestand?: number | null;
          name: string;
          only_internal?: boolean;
          standort_id?: number | null;
          updated_at?: string;
          zustand?: Database["public"]["Enums"]["material_zustand"] | null;
        };
        Update: {
          abteilung_id?: string;
          anzahl?: number;
          archiviert?: boolean;
          beschreibung?: string | null;
          consumable?: boolean;
          created_at?: string;
          damaged?: number;
          gewicht_kg?: number | null;
          id?: number;
          image_urls?: string[];
          inventarnummer?: string | null;
          kaufdatum?: string | null;
          kaufpreis?: number | null;
          lost?: number;
          min_bestand?: number | null;
          name?: string;
          only_internal?: boolean;
          standort_id?: number | null;
          updated_at?: string;
          zustand?: Database["public"]["Enums"]["material_zustand"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "material_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_standort_id_fkey";
            columns: ["standort_id"];
            isOneToOne: false;
            referencedRelation: "standorte";
            referencedColumns: ["id"];
          },
        ];
      };
      material_kategorien: {
        Row: {
          kategorie_id: number;
          material_id: number;
        };
        ComputedFields: never;
        Insert: {
          kategorie_id: number;
          material_id: number;
        };
        Update: {
          kategorie_id?: number;
          material_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "material_kategorien_kategorie_id_fkey";
            columns: ["kategorie_id"];
            isOneToOne: false;
            referencedRelation: "kategorien";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_kategorien_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "material";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_kategorien_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "material_unter_min";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_kategorien_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "stat_material";
            referencedColumns: ["material_id"];
          },
        ];
      };
      midata_role_mapping: {
        Row: {
          abteilung_id: string | null;
          id: number;
          role: Database["public"]["Enums"]["member_role"];
          role_class: string;
        };
        ComputedFields: never;
        Insert: {
          abteilung_id?: string | null;
          id?: number;
          role: Database["public"]["Enums"]["member_role"];
          role_class: string;
        };
        Update: {
          abteilung_id?: string | null;
          id?: number;
          role?: Database["public"]["Enums"]["member_role"];
          role_class?: string;
        };
        Relationships: [
          {
            foreignKeyName: "midata_role_mapping_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          midata_id: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          midata_id?: number | null;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          midata_id?: number | null;
        };
        Relationships: [];
      };
      sammlung_items: {
        Row: {
          anzahl: number;
          material_id: number;
          sammlung_id: number;
        };
        ComputedFields: never;
        Insert: {
          anzahl: number;
          material_id: number;
          sammlung_id: number;
        };
        Update: {
          anzahl?: number;
          material_id?: number;
          sammlung_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sammlung_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "material";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sammlung_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "material_unter_min";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sammlung_items_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "stat_material";
            referencedColumns: ["material_id"];
          },
          {
            foreignKeyName: "sammlung_items_sammlung_id_fkey";
            columns: ["sammlung_id"];
            isOneToOne: false;
            referencedRelation: "sammlungen";
            referencedColumns: ["id"];
          },
        ];
      };
      sammlungen: {
        Row: {
          abteilung_id: string;
          beschreibung: string | null;
          id: number;
          image_url: string | null;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          abteilung_id: string;
          beschreibung?: string | null;
          id?: number;
          image_url?: string | null;
          name: string;
        };
        Update: {
          abteilung_id?: string;
          beschreibung?: string | null;
          id?: number;
          image_url?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sammlungen_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
      schadensmeldungen: {
        Row: {
          abteilung_id: string;
          anzahl: number;
          bearbeitet_von: string | null;
          beschreibung: string | null;
          bestellung_id: number | null;
          created_at: string;
          erledigt_at: string | null;
          foto_path: string | null;
          gemeldet_von: string | null;
          id: number;
          material_id: number;
          status: Database["public"]["Enums"]["schaden_status"];
          typ: Database["public"]["Enums"]["schaden_typ"];
        };
        ComputedFields: never;
        Insert: {
          abteilung_id: string;
          anzahl?: number;
          bearbeitet_von?: string | null;
          beschreibung?: string | null;
          bestellung_id?: number | null;
          created_at?: string;
          erledigt_at?: string | null;
          foto_path?: string | null;
          gemeldet_von?: string | null;
          id?: number;
          material_id: number;
          status?: Database["public"]["Enums"]["schaden_status"];
          typ?: Database["public"]["Enums"]["schaden_typ"];
        };
        Update: {
          abteilung_id?: string;
          anzahl?: number;
          bearbeitet_von?: string | null;
          beschreibung?: string | null;
          bestellung_id?: number | null;
          created_at?: string;
          erledigt_at?: string | null;
          foto_path?: string | null;
          gemeldet_von?: string | null;
          id?: number;
          material_id?: number;
          status?: Database["public"]["Enums"]["schaden_status"];
          typ?: Database["public"]["Enums"]["schaden_typ"];
        };
        Relationships: [
          {
            foreignKeyName: "schadensmeldungen_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schadensmeldungen_bearbeitet_von_fkey";
            columns: ["bearbeitet_von"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schadensmeldungen_bestellung_id_fkey";
            columns: ["bestellung_id"];
            isOneToOne: false;
            referencedRelation: "bestellungen";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schadensmeldungen_gemeldet_von_fkey";
            columns: ["gemeldet_von"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schadensmeldungen_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "material";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schadensmeldungen_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "material_unter_min";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schadensmeldungen_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "stat_material";
            referencedColumns: ["material_id"];
          },
        ];
      };
      standorte: {
        Row: {
          abteilung_id: string;
          adresse: string | null;
          id: number;
          name: string;
          notiz: string | null;
        };
        ComputedFields: never;
        Insert: {
          abteilung_id: string;
          adresse?: string | null;
          id?: number;
          name: string;
          notiz?: string | null;
        };
        Update: {
          abteilung_id?: string;
          adresse?: string | null;
          id?: number;
          name?: string;
          notiz?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "standorte_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      material_unter_min: {
        Row: {
          abteilung_id: string | null;
          bestand: number | null;
          fehlend: number | null;
          id: number | null;
          min_bestand: number | null;
          name: string | null;
        };
        ComputedFields: never;
        Insert: {
          abteilung_id?: string | null;
          bestand?: never;
          fehlend?: never;
          id?: number | null;
          min_bestand?: number | null;
          name?: string | null;
        };
        Update: {
          abteilung_id?: string | null;
          bestand?: never;
          fehlend?: never;
          id?: number | null;
          min_bestand?: number | null;
          name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "material_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
      stat_ausleihen_monat: {
        Row: {
          abteilung_id: string | null;
          anlass: string | null;
          bestellungen: number | null;
          monat: string | null;
          stufe: string | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "bestellungen_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
      stat_inventarwert: {
        Row: {
          abteilung_id: string | null;
          ohne_preis: number | null;
          wert: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "material_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
      stat_material: {
        Row: {
          abteilung_id: string | null;
          ausleihen: number | null;
          letzte_ausleihe: string | null;
          material_id: number | null;
          name: string | null;
          schadensmeldungen: number | null;
          stueck: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "material_abteilung_id_fkey";
            columns: ["abteilung_id"];
            isOneToOne: false;
            referencedRelation: "abteilungen";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      abteilung_beitreten: { Args: { p_slug: string }; Returns: string };
      bestellung_erstellen: {
        Args: {
          p_abteilung: string;
          p_anlass_id?: number;
          p_bis: string;
          p_gruppe_freitext?: string;
          p_items: Json;
          p_kommentar?: string;
          p_stufe_id?: number;
          p_von: string;
        };
        Returns: number;
      };
      bestellung_stornieren: { Args: { p_id: number }; Returns: undefined };
      bestellung_verlaengern: { Args: { p_bis: string; p_id: number }; Returns: undefined };
      has_role: {
        Args: { p_abteilung: string; p_min: Database["public"]["Enums"]["member_role"] };
        Returns: boolean;
      };
      ical_feed: {
        Args: { p_token: string };
        Returns: {
          abteilung: string;
          bestellung_id: number;
          bis: string;
          items: string;
          status: Database["public"]["Enums"]["bestellung_status"];
          titel: string;
          von: string;
        }[];
      };
      kalender_belegung: {
        Args: { p_abteilung: string; p_bis: string; p_von: string };
        Returns: {
          anlass: string;
          anzahl: number;
          bestellung_id: number;
          bis: string;
          eigene: boolean;
          freitext: string;
          material: string;
          material_id: number;
          status: Database["public"]["Enums"]["bestellung_status"];
          stufe: string;
          von: string;
        }[];
      };
      material_verfuegbarkeit: {
        Args: { p_abteilung: string; p_bis: string; p_von: string };
        Returns: {
          material_id: number;
          verfuegbar: number;
        }[];
      };
      midata_sync: { Args: { p_roles: Json; p_user: string }; Returns: undefined };
      teilt_abteilung: { Args: { p_other: string }; Returns: boolean };
    };
    Enums: {
      bestellung_status:
        | "pending"
        | "created"
        | "delivered"
        | "completed"
        | "rejected"
        | "cancelled";
      gruppe_typ: "stufe" | "anlass" | "sonstiges";
      material_zustand: "neu" | "gut" | "gebraucht" | "schlecht";
      member_role: "pending" | "guest" | "member" | "matchef" | "admin";
      schaden_status: "offen" | "in_reparatur" | "erledigt" | "abgeschrieben";
      schaden_typ: "damaged" | "lost";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bestellung_status: ["pending", "created", "delivered", "completed", "rejected", "cancelled"],
      gruppe_typ: ["stufe", "anlass", "sonstiges"],
      material_zustand: ["neu", "gut", "gebraucht", "schlecht"],
      member_role: ["pending", "guest", "member", "matchef", "admin"],
      schaden_status: ["offen", "in_reparatur", "erledigt", "abgeschrieben"],
      schaden_typ: ["damaged", "lost"],
    },
  },
} as const;
