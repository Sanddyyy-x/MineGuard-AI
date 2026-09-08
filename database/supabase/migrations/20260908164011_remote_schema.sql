SET local check_function_bodies = off;

CREATE TABLE "public"."alerts" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "mine_id"              uuid                     NOT NULL,
  "violation_id"         uuid,
  "corrective_action_id" uuid,
  "alert_type"           text                     NOT NULL,
  "title"                text                     NOT NULL,
  "message"              text                     NOT NULL,
  "severity"             text                     NOT NULL DEFAULT 'Medium'::text,
  "status"               text                     NOT NULL DEFAULT 'Unread'::text,
  "due_date"             date,
  "resolved_at"          timestamp with time zone,
  "assigned_to"          uuid,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "alerts_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."alerts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."audit_logs" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "actor_id"    uuid,
  "mine_id"     uuid,
  "action"      text                     NOT NULL,
  "entity_type" text                     NOT NULL,
  "entity_id"   uuid,
  "old_data"    jsonb,
  "new_data"    jsonb,
  "metadata"    jsonb,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."audit_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."compliance_records" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "mine_id"          uuid                     NOT NULL,
  "requirement_id"   uuid,
  "due_date"         date,
  "completion_date"  date,
  "status"           text                     DEFAULT 'Pending'::text,
  "compliance_score" double precision,
  "remarks"          text,
  "created_by"       uuid,
  "created_at"       timestamp with time zone DEFAULT now(),
  "updated_at"       timestamp with time zone DEFAULT now(),
  "data_source"      text                     DEFAULT 'Synthetic demonstration'::text,
  CONSTRAINT "compliance_records_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."compliance_records"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."compliance_requirements" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "requirement_code" text                     NOT NULL,
  "title"            text                     NOT NULL,
  "description"      text,
  "category"         text                     NOT NULL,
  "authority"        text,
  "frequency"        text,
  "severity_level"   text,
  "created_at"       timestamp with time zone DEFAULT now(),
  CONSTRAINT "compliance_requirements_pkey" PRIMARY KEY (id),
  CONSTRAINT "compliance_requirements_requirement_code_key" UNIQUE (requirement_code)
);

ALTER TABLE "public"."compliance_requirements"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."corrective_actions" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "violation_id"        uuid                     NOT NULL,
  "assigned_to"         uuid,
  "action_description"  text                     NOT NULL,
  "due_date"            date,
  "completion_date"     date,
  "status"              text                     DEFAULT 'Pending'::text,
  "verification_status" text                     DEFAULT 'Not Verified'::text,
  "verified_by"         uuid,
  "remarks"             text,
  "created_at"          timestamp with time zone DEFAULT now(),
  CONSTRAINT "corrective_actions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."corrective_actions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."documents" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "mine_id"              uuid                     NOT NULL,
  "uploaded_by"          uuid,
  "document_type"        text                     NOT NULL,
  "title"                text                     NOT NULL,
  "description"          text,
  "storage_path"         text                     NOT NULL,
  "file_name"            text                     NOT NULL,
  "mime_type"            text,
  "file_size"            bigint,
  "inspection_id"        uuid,
  "compliance_record_id" uuid,
  "violation_id"         uuid,
  "corrective_action_id" uuid,
  "ocr_status"           text                     NOT NULL DEFAULT 'Pending'::text,
  "ocr_text"             text,
  "status"               text                     NOT NULL DEFAULT 'Active'::text,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "ocr_started_at"       timestamp with time zone,
  "ocr_completed_at"     timestamp with time zone,
  "ocr_error"            text,
  "ocr_attempts"         integer                  NOT NULL DEFAULT 0,
  "ocr_next_attempt_at"  timestamp with time zone,
  "ocr_provider"         text,
  "ocr_document_hash"    text,
  CONSTRAINT "documents_ocr_status_check" CHECK ((ocr_status = ANY (ARRAY['Pending'::text, 'Processing'::text, 'Completed'::text, 'Failed'::text]))),
  CONSTRAINT "documents_pkey" PRIMARY KEY (id),
  CONSTRAINT "documents_status_check" CHECK ((status = ANY (ARRAY['Active'::text, 'Archived'::text])))
);

ALTER TABLE "public"."documents"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."inspections" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "mine_id"         uuid                     NOT NULL,
  "inspector_id"    uuid,
  "inspection_type" text,
  "inspection_date" timestamp with time zone DEFAULT now(),
  "latitude"        double precision,
  "longitude"       double precision,
  "overall_status"  text,
  "summary"         text,
  "created_at"      timestamp with time zone DEFAULT now(),
  CONSTRAINT "inspections_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."inspections"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."mine_user_assignments" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "mine_id"     uuid                     NOT NULL,
  "assigned_at" timestamp with time zone NOT NULL DEFAULT now(),
  "status"      text                     NOT NULL DEFAULT 'Active'::text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "mine_user_assignments_pkey" PRIMARY KEY (id),
  CONSTRAINT "mine_user_assignments_status_check" CHECK ((status = ANY (ARRAY['Active'::text, 'Inactive'::text]))),
  CONSTRAINT "mine_user_assignments_unique" UNIQUE (user_id, mine_id)
);

ALTER TABLE "public"."mine_user_assignments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."mines" (
  "id"                             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "subsidiary_id"                  uuid,
  "mine_name"                      text                     NOT NULL,
  "mine_code"                      text,
  "state"                          text,
  "district"                       text,
  "latitude"                       double precision,
  "longitude"                      double precision,
  "area_hectares"                  double precision,
  "coal_grade"                     text,
  "target_capacity_mtpa"           double precision,
  "resource_mt"                    double precision,
  "exploration_status"             text,
  "environmental_clearance"        boolean                  DEFAULT false,
  "forest_clearance"               boolean                  DEFAULT false,
  "status"                         text                     DEFAULT 'Active'::text,
  "created_at"                     timestamp with time zone DEFAULT now(),
  "updated_at"                     timestamp with time zone DEFAULT now(),
  "coalfield"                      text,
  "villages"                       text,
  "tehsil"                         text,
  "topo_sheet_no"                  text,
  "latitude_raw"                   text,
  "longitude_raw"                  text,
  "geological_area_sq_km"          double precision,
  "mining_lease_area_ha"           double precision,
  "project_area_ha"                double precision,
  "forest_area_ha"                 double precision,
  "non_forest_area_ha"             double precision,
  "rainfall_min_mm"                double precision,
  "rainfall_max_mm"                double precision,
  "temperature_min_c"              double precision,
  "temperature_max_c"              double precision,
  "exploration_agency"             text,
  "exploration_details"            text,
  "borehole_count"                 integer,
  "borehole_meterage_m"            double precision,
  "borehole_density"               double precision,
  "total_geological_reserve_mt"    double precision,
  "total_extractable_reserve_mt"   double precision,
  "total_overburden_mcum"          double precision,
  "stripping_ratio"                double precision,
  "mining_method"                  text,
  "previous_allocatee"             text,
  "mining_plan_status"             text,
  "forest_clearance_status"        text,
  "environmental_clearance_status" text,
  "mining_lease_status"            text,
  "land_acquisition_status"        text,
  "paf_count"                      text,
  "surface_infrastructure"         text,
  "source_document"                text,
  "source_url"                     text,
  "data_source"                    text                     DEFAULT 'Ministry of Coal'::text,
  CONSTRAINT "mines_mine_code_key" UNIQUE (mine_code),
  CONSTRAINT "mines_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."mines"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."observations" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "inspection_id" uuid                     NOT NULL,
  "category"      text,
  "description"   text,
  "severity"      text,
  "latitude"      double precision,
  "longitude"     double precision,
  "photo_url"     text,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "observations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."observations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."permissions" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "permission_code" text                     NOT NULL,
  "description"     text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "permissions_permission_code_key" UNIQUE (permission_code),
  CONSTRAINT "permissions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."permissions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "full_name"    text,
  "email"        text,
  "role"         text,
  "organization" text,
  "status"       text                     NOT NULL DEFAULT 'Active'::text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check"
    CHECK
    (((role = ANY (ARRAY['Admin'::text, 'Subsidiary Admin'::text, 'Mine Manager'::text, 'Inspector'::text, 'Safety Officer'::text, 'Contractor/Worker'::text])) OR (role IS NULL))),
  CONSTRAINT "profiles_status_check" CHECK ((status = ANY (ARRAY['Pending'::text, 'Active'::text, 'Rejected'::text, 'Inactive'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."risk_assessments" (
  "id"                        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "mine_id"                   uuid                     NOT NULL,
  "assessment_date"           timestamp with time zone DEFAULT now(),
  "compliance_rate"           double precision,
  "violation_count"           integer                  DEFAULT 0,
  "overdue_action_count"      integer                  DEFAULT 0,
  "recurring_violation_count" integer                  DEFAULT 0,
  "inspection_frequency"      double precision,
  "avg_closure_time"          double precision,
  "environmental_issue_count" integer                  DEFAULT 0,
  "contractor_issue_count"    integer                  DEFAULT 0,
  "risk_score"                double precision,
  "risk_level"                text,
  "ai_explanation"            text,
  "created_at"                timestamp with time zone DEFAULT now(),
  CONSTRAINT "risk_assessments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."risk_assessments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."role_permissions" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "role"          text                     NOT NULL,
  "permission_id" uuid                     NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY (id),
  CONSTRAINT "role_permissions_role_check"
    CHECK ((role = ANY (ARRAY['Admin'::text, 'Subsidiary Admin'::text, 'Mine Manager'::text, 'Inspector'::text, 'Safety Officer'::text, 'Contractor/Worker'::text]))),
  CONSTRAINT "role_permissions_unique" UNIQUE (ROLE, permission_id)
);

ALTER TABLE "public"."role_permissions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."subsidiaries" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "code"       text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "subsidiaries_code_key" UNIQUE (code),
  CONSTRAINT "subsidiaries_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."subsidiaries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."users" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "auth_user_id"  uuid,
  "full_name"     text                     NOT NULL,
  "email"         text,
  "role"          text                     NOT NULL,
  "subsidiary_id" uuid,
  "mine_id"       uuid,
  "created_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "users_auth_user_id_key" UNIQUE (auth_user_id),
  CONSTRAINT "users_email_key" UNIQUE (email),
  CONSTRAINT "users_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."violations" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "mine_id"        uuid                     NOT NULL,
  "observation_id" uuid,
  "violation_code" text,
  "title"          text                     NOT NULL,
  "description"    text,
  "category"       text,
  "severity"       text,
  "status"         text                     DEFAULT 'Open'::text,
  "detected_date"  timestamp with time zone DEFAULT now(),
  "resolved_date"  timestamp with time zone,
  "recurring"      boolean                  DEFAULT false,
  "created_at"     timestamp with time zone DEFAULT now(),
  CONSTRAINT "violations_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."violations"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.approve_mineguard_user (
  requested_user_id uuid,
  requested_role    text,
  requested_mine_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    target_profile public.profiles%ROWTYPE;
    target_mine public.mines%ROWTYPE;
BEGIN
    -- Only authorized Admins can approve users.
    IF NOT public.has_permission('manage_users') THEN
        RAISE EXCEPTION 'Unauthorized: Admin permission required';
    END IF;

    -- Prevent approving yourself through this workflow.
    IF requested_user_id = auth.uid() THEN
        RAISE EXCEPTION 'An administrator cannot approve their own account';
    END IF;

    -- Validate role.
    IF requested_role NOT IN (
        'Admin',
        'Subsidiary Admin',
        'Mine Manager',
        'Inspector',
        'Safety Officer',
        'Contractor/Worker'
    ) THEN
        RAISE EXCEPTION 'Invalid role: %', requested_role;
    END IF;

    -- Load target profile.
    SELECT *
    INTO target_profile
    FROM public.profiles
    WHERE id = requested_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Only Pending users can be approved.
    IF target_profile.status <> 'Pending' THEN
        RAISE EXCEPTION
            'User cannot be approved because current status is %',
            target_profile.status;
    END IF;

    -- Validate mine.
    SELECT *
    INTO target_mine
    FROM public.mines
    WHERE id = requested_mine_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mine not found';
    END IF;

    -- Update profile.
    UPDATE public.profiles
    SET
        role = requested_role,
        status = 'Active',
        updated_at = now()
    WHERE id = requested_user_id;

    -- Create/activate the user's mine assignment.
    INSERT INTO public.mine_user_assignments (
        user_id,
        mine_id,
        status
    )
    VALUES (
        requested_user_id,
        requested_mine_id,
        'Active'
    )
    ON CONFLICT (user_id, mine_id)
    DO UPDATE
    SET
        status = 'Active';

    -- Write explicit approval audit entry.
    INSERT INTO public.audit_logs (
        actor_id,
        mine_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        metadata
    )
    VALUES (
        auth.uid(),
        requested_mine_id,
        'USER_APPROVED',
        'profile',
        requested_user_id,
        jsonb_build_object(
            'role', target_profile.role,
            'status', target_profile.status
        ),
        jsonb_build_object(
            'role', requested_role,
            'status', 'Active',
            'mine_id', requested_mine_id
        ),
        jsonb_build_object(
            'approved_by', auth.uid(),
            'approval_method', 'admin_workflow'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', requested_user_id,
        'email', target_profile.email,
        'role', requested_role,
        'status', 'Active',
        'mine_id', requested_mine_id,
        'mine_code', target_mine.mine_code,
        'mine_name', target_mine.mine_name
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_mine_risk_assessment (
  requested_mine_id uuid
)
  RETURNS public.risk_assessments
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    result public.risk_assessments;
    v_compliance_rate double precision;
    v_violation_count integer;
    v_overdue_action_count integer;
    v_recurring_violation_count integer;
    v_inspection_frequency double precision;
    v_avg_closure_time double precision;
    v_environmental_issue_count integer;
    v_contractor_issue_count integer;

    v_compliance_risk double precision;
    v_violation_risk double precision;
    v_recurring_risk double precision;
    v_overdue_action_risk double precision;
    v_inspection_risk double precision;
    v_closure_time_risk double precision;
    v_environmental_risk double precision;
    v_contractor_risk double precision;

    v_risk_score double precision;
    v_risk_level text;
    v_explanation text;
BEGIN

    /* Verify that the mine exists */
    IF NOT EXISTS (
        SELECT 1
        FROM public.mines
        WHERE id = requested_mine_id
    ) THEN
        RAISE EXCEPTION 'Mine not found';
    END IF;

    /* Compliance */
    SELECT
        COALESCE(AVG(cr.compliance_score), 0)
    INTO v_compliance_rate
    FROM public.compliance_records AS cr
    WHERE cr.mine_id = requested_mine_id;

    v_compliance_risk :=
        GREATEST(
            0,
            LEAST(
                100,
                100 - v_compliance_rate
            )
        );

    /* Violations */
    SELECT
        COUNT(*),
        COALESCE(
            SUM(
                CASE v.severity
                    WHEN 'Critical' THEN 40
                    WHEN 'High' THEN 25
                    WHEN 'Medium' THEN 15
                    WHEN 'Low' THEN 5
                    ELSE 10
                END
            ),
            0
        )::double precision,
        COUNT(*) FILTER (WHERE v.recurring = true),
        COUNT(*) FILTER (WHERE v.category = 'Environmental'),
        COUNT(*) FILTER (WHERE v.category = 'Contractor')
    INTO
        v_violation_count,
        v_violation_risk,
        v_recurring_violation_count,
        v_environmental_issue_count,
        v_contractor_issue_count
    FROM public.violations AS v
    WHERE v.mine_id = requested_mine_id;

    v_violation_risk :=
        LEAST(100, v_violation_risk);

    v_recurring_risk :=
        LEAST(
            100,
            v_recurring_violation_count * 25
        );

    v_environmental_risk :=
        LEAST(
            100,
            v_environmental_issue_count * 20
        );

    v_contractor_risk :=
        LEAST(
            100,
            v_contractor_issue_count * 20
        );

    /* Overdue corrective actions */
    SELECT
        COUNT(*)
    INTO v_overdue_action_count
    FROM public.corrective_actions AS ca
    JOIN public.violations AS v
        ON v.id = ca.violation_id
    WHERE v.mine_id = requested_mine_id
      AND ca.status <> 'Completed'
      AND ca.due_date < CURRENT_DATE;

    v_overdue_action_risk :=
        LEAST(
            100,
            v_overdue_action_count * 25
        );

    /* Inspection frequency */
    SELECT
        COUNT(*),
        COUNT(*)::double precision
    INTO
        v_inspection_frequency,
        v_inspection_frequency
    FROM public.inspections AS i
    WHERE i.mine_id = requested_mine_id;

    v_inspection_risk :=
        CASE
            WHEN v_inspection_frequency >= 4 THEN 0
            WHEN v_inspection_frequency = 3 THEN 15
            WHEN v_inspection_frequency = 2 THEN 25
            WHEN v_inspection_frequency = 1 THEN 50
            ELSE 75
        END;

    /* Valid closure time only */
    SELECT
        COALESCE(
            AVG(
                EXTRACT(
                    EPOCH FROM (
                        ca.completion_date::timestamptz
                        - ca.created_at
                    )
                ) / 86400.0
            ),
            0
        )
    INTO v_avg_closure_time
    FROM public.corrective_actions AS ca
    JOIN public.violations AS v
        ON v.id = ca.violation_id
    WHERE v.mine_id = requested_mine_id
      AND ca.completion_date IS NOT NULL
      AND ca.completion_date::timestamptz >= ca.created_at;

    v_closure_time_risk :=
        LEAST(
            100,
            GREATEST(
                0,
                v_avg_closure_time * 2
            )
        );

    /* Final weighted score */
    v_risk_score :=
        ROUND(
            (
                v_compliance_risk * 0.35 +
                v_violation_risk * 0.20 +
                v_recurring_risk * 0.15 +
                v_overdue_action_risk * 0.10 +
                v_inspection_risk * 0.05 +
                v_closure_time_risk * 0.05 +
                v_environmental_risk * 0.05 +
                v_contractor_risk * 0.05
            )::numeric,
            2
        )::double precision;

    /* Risk classification */
    v_risk_level :=
        CASE
            WHEN v_risk_score >= 75 THEN 'Critical'
            WHEN v_risk_score >= 50 THEN 'High'
            WHEN v_risk_score >= 25 THEN 'Medium'
            ELSE 'Low'
        END;

    /* Transparent explanation */
    v_explanation :=
        'Risk assessment based on compliance performance, violation severity, recurring violations, overdue corrective actions, inspection frequency, closure time, environmental issues, and contractor issues. '
        || 'Compliance risk: ' || ROUND(v_compliance_risk::numeric, 2)
        || '; violation risk: ' || ROUND(v_violation_risk::numeric, 2)
        || '; recurring risk: ' || ROUND(v_recurring_risk::numeric, 2)
        || '; overdue action risk: ' || ROUND(v_overdue_action_risk::numeric, 2)
        || '; inspection risk: ' || ROUND(v_inspection_risk::numeric, 2)
        || '; environmental risk: ' || ROUND(v_environmental_risk::numeric, 2)
        || '; contractor risk: ' || ROUND(v_contractor_risk::numeric, 2)
        || '. Final score: ' || ROUND(v_risk_score::numeric, 2)
        || ' (' || v_risk_level || ').';

    /* Store assessment */
    INSERT INTO public.risk_assessments (
        mine_id,
        assessment_date,
        compliance_rate,
        violation_count,
        overdue_action_count,
        recurring_violation_count,
        inspection_frequency,
        avg_closure_time,
        environmental_issue_count,
        contractor_issue_count,
        risk_score,
        risk_level,
        ai_explanation
    )
    VALUES (
        requested_mine_id,
        now(),
        v_compliance_rate,
        v_violation_count,
        v_overdue_action_count,
        v_recurring_violation_count,
        v_inspection_frequency,
        v_avg_closure_time,
        v_environmental_issue_count,
        v_contractor_issue_count,
        v_risk_score,
        v_risk_level,
        v_explanation
    )
    RETURNING *
    INTO result;

    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_document_ocr (
  requested_document_id   uuid,
  extracted_text          text,
  requested_provider      text DEFAULT NULL::text,
  requested_document_hash text DEFAULT NULL::text
)
  RETURNS public.documents
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    updated_document public.documents;
BEGIN

    UPDATE public.documents
    SET
        ocr_status = 'Completed',
        ocr_text = extracted_text,
        ocr_completed_at = now(),
        ocr_error = NULL,
        ocr_provider = requested_provider,
        ocr_document_hash = requested_document_hash,
        ocr_next_attempt_at = NULL,
        updated_at = now()
    WHERE id = requested_document_id
      AND status = 'Active'
      AND ocr_status = 'Processing'
      AND public.has_mine_access(mine_id)
    RETURNING * INTO updated_document;

    IF updated_document.id IS NULL THEN
        RAISE EXCEPTION
            'Document is not currently being processed or access is denied';
    END IF;

    RETURN updated_document;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deactivate_mineguard_user (
  requested_user_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    target_profile public.profiles%ROWTYPE;
    affected_mines integer;
BEGIN
    -- Only authorized Admins can deactivate users.
    IF NOT public.has_permission('manage_users') THEN
        RAISE EXCEPTION 'Unauthorized: Admin permission required';
    END IF;

    -- Prevent an administrator from deactivating their own account.
    IF requested_user_id = auth.uid() THEN
        RAISE EXCEPTION 'An administrator cannot deactivate their own account';
    END IF;

    -- Load and lock the target profile.
    SELECT *
    INTO target_profile
    FROM public.profiles
    WHERE id = requested_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Only Active users can be deactivated.
    IF target_profile.status <> 'Active' THEN
        RAISE EXCEPTION
            'User cannot be deactivated because current status is %',
            target_profile.status;
    END IF;

    -- Deactivate the user's active mine assignments.
    UPDATE public.mine_user_assignments
    SET status = 'Inactive'
    WHERE user_id = requested_user_id
      AND status = 'Active';

    GET DIAGNOSTICS affected_mines = ROW_COUNT;

    -- Deactivate the profile without deleting the account.
    UPDATE public.profiles
    SET
        status = 'Inactive',
        updated_at = now()
    WHERE id = requested_user_id;

    -- Record the administrative action.
    INSERT INTO public.audit_logs (
        actor_id,
        mine_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        metadata
    )
    VALUES (
        auth.uid(),
        NULL,
        'USER_DEACTIVATED',
        'profile',
        requested_user_id,
        jsonb_build_object(
            'role', target_profile.role,
            'status', target_profile.status
        ),
        jsonb_build_object(
            'role', target_profile.role,
            'status', 'Inactive'
        ),
        jsonb_build_object(
            'deactivated_by', auth.uid(),
            'deactivated_mine_assignments', affected_mines
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', requested_user_id,
        'email', target_profile.email,
        'role', target_profile.role,
        'status', 'Inactive',
        'deactivated_mine_assignments', affected_mines
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.fail_document_ocr (
  requested_document_id uuid,
  processing_error      text,
  retry_after_minutes   integer DEFAULT 30
)
  RETURNS public.documents
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    updated_document public.documents;
BEGIN

    IF retry_after_minutes < 0 THEN
        RAISE EXCEPTION
            'retry_after_minutes cannot be negative';
    END IF;

    UPDATE public.documents
    SET
        ocr_status = 'Failed',
        ocr_error = LEFT(processing_error, 4000),
        ocr_completed_at = NULL,
        ocr_next_attempt_at =
            CASE
                WHEN ocr_attempts < 3
                THEN now() + make_interval(mins => retry_after_minutes)
                ELSE NULL
            END,
        updated_at = now()
    WHERE id = requested_document_id
      AND status = 'Active'
      AND ocr_status = 'Processing'
      AND public.has_mine_access(mine_id)
    RETURNING * INTO updated_document;

    IF updated_document.id IS NULL THEN
        RAISE EXCEPTION
            'Document is not currently being processed or access is denied';
    END IF;

    RETURN updated_document;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_automated_alerts()
  RETURNS TABLE (
    created_alert_id uuid,
    mine_id          uuid,
    alert_type       text,
    severity         text,
    title            text
  )
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN

    /* High / Critical violations */
    INSERT INTO public.alerts (
        mine_id,
        violation_id,
        alert_type,
        title,
        message,
        severity,
        status,
        due_date
    )
    SELECT
        v.mine_id,
        v.id,
        'High Severity Violation',
        CASE
            WHEN v.severity = 'Critical'
                THEN 'Critical-Severity Violation'
            ELSE 'High-Severity Violation'
        END,
        'A ' || v.severity || '-severity ' || v.category
            || ' violation requires immediate attention.',
        v.severity,
        'Unread',
        NULL
    FROM public.violations AS v
    WHERE v.status = 'Open'
      AND v.severity IN ('High', 'Critical')
      AND NOT EXISTS (
          SELECT 1
          FROM public.alerts AS a
          WHERE a.violation_id = v.id
            AND a.alert_type = 'High Severity Violation'
      );

    /* Recurring violations */
    INSERT INTO public.alerts (
        mine_id,
        violation_id,
        alert_type,
        title,
        message,
        severity,
        status,
        due_date
    )
    SELECT
        v.mine_id,
        v.id,
        'Recurring Violation',
        'Recurring Violation Detected',
        'A recurring ' || v.category
            || ' violation has been identified and requires review.',
        CASE
            WHEN v.severity IN ('High', 'Critical')
                THEN v.severity
            ELSE 'Medium'
        END,
        'Unread',
        NULL
    FROM public.violations AS v
    WHERE v.status = 'Open'
      AND v.recurring = true
      AND NOT EXISTS (
          SELECT 1
          FROM public.alerts AS a
          WHERE a.violation_id = v.id
            AND a.alert_type = 'Recurring Violation'
      );

    /* Overdue corrective actions */
    INSERT INTO public.alerts (
        mine_id,
        violation_id,
        corrective_action_id,
        alert_type,
        title,
        message,
        severity,
        status,
        due_date
    )
    SELECT
        v.mine_id,
        ca.violation_id,
        ca.id,
        'Overdue Corrective Action',
        'Overdue Corrective Action',
        'A corrective action is overdue by '
            || (CURRENT_DATE - ca.due_date)
            || ' day(s) and requires immediate follow-up.',
        CASE
            WHEN v.severity IN ('High', 'Critical')
                THEN v.severity
            ELSE 'High'
        END,
        'Unread',
        ca.due_date
    FROM public.corrective_actions AS ca
    JOIN public.violations AS v
        ON v.id = ca.violation_id
    WHERE ca.status <> 'Completed'
      AND ca.due_date IS NOT NULL
      AND ca.due_date < CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1
          FROM public.alerts AS a
          WHERE a.corrective_action_id = ca.id
            AND a.alert_type = 'Overdue Corrective Action'
      );

    /* Corrective actions due within three days */
    INSERT INTO public.alerts (
        mine_id,
        violation_id,
        corrective_action_id,
        alert_type,
        title,
        message,
        severity,
        status,
        due_date
    )
    SELECT
        v.mine_id,
        ca.violation_id,
        ca.id,
        'Corrective Action Due Soon',
        'Corrective Action Due Soon',
        'A corrective action is due within '
            || (ca.due_date - CURRENT_DATE)
            || ' day(s). Follow-up may be required.',
        CASE
            WHEN v.severity IN ('High', 'Critical')
                THEN v.severity
            ELSE 'Medium'
        END,
        'Unread',
        ca.due_date
    FROM public.corrective_actions AS ca
    JOIN public.violations AS v
        ON v.id = ca.violation_id
    WHERE ca.status <> 'Completed'
      AND ca.due_date IS NOT NULL
      AND ca.due_date >= CURRENT_DATE
      AND ca.due_date <= CURRENT_DATE + 3
      AND NOT EXISTS (
          SELECT 1
          FROM public.alerts AS a
          WHERE a.corrective_action_id = ca.id
            AND a.alert_type = 'Corrective Action Due Soon'
      );

    /*
     * Return alerts created during this execution.
     * The created_at timestamp identifies the current execution window.
     */
    RETURN QUERY
    SELECT
        a.id,
        a.mine_id,
        a.alert_type,
        a.severity,
        a.title
    FROM public.alerts AS a
    WHERE a.created_at >= statement_timestamp()
    ORDER BY a.created_at, a.alert_type;

END;
$function$;

CREATE OR REPLACE FUNCTION public.get_accessible_mines()
  RETURNS SETOF public.mines
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
    SELECT m.*
    FROM public.mines AS m
    WHERE public.has_mine_access(m.id)
    ORDER BY m.mine_code, m.mine_name;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_active_users()
  RETURNS TABLE (
    user_id            uuid,
    email              text,
    full_name          text,
    role               text,
    status             text,
    assigned_mine_id   uuid,
    assigned_mine_code text,
    assigned_mine_name text,
    assigned_at        timestamp with time zone,
    created_at         timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
    SELECT
        p.id AS user_id,
        p.email,
        p.full_name,
        p.role,
        p.status,
        mua.mine_id AS assigned_mine_id,
        m.mine_code AS assigned_mine_code,
        m.mine_name AS assigned_mine_name,
        mua.assigned_at,
        p.created_at
    FROM public.profiles AS p
    LEFT JOIN public.mine_user_assignments AS mua
        ON mua.user_id = p.id
       AND mua.status = 'Active'
    LEFT JOIN public.mines AS m
        ON m.id = mua.mine_id
    WHERE p.status = 'Active'
      AND public.has_permission('manage_users')
    ORDER BY p.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_mine_list()
  RETURNS TABLE (
    mine_id   uuid,
    mine_code text,
    mine_name text
  )
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
    SELECT
        m.id AS mine_id,
        m.mine_code,
        m.mine_name
    FROM public.mines AS m
    WHERE public.has_permission('manage_users')
    ORDER BY m.mine_code ASC;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_user_management_summary()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
    SELECT jsonb_build_object(
        'total_users',
        (
            SELECT COUNT(*)
            FROM public.profiles
        ),

        'pending_users',
        (
            SELECT COUNT(*)
            FROM public.profiles
            WHERE status = 'Pending'
        ),

        'active_users',
        (
            SELECT COUNT(*)
            FROM public.profiles
            WHERE status = 'Active'
        ),

        'inactive_users',
        (
            SELECT COUNT(*)
            FROM public.profiles
            WHERE status = 'Inactive'
        ),

        'rejected_users',
        (
            SELECT COUNT(*)
            FROM public.profiles
            WHERE status = 'Rejected'
        ),

        'users_by_role',
        COALESCE(
            (
                SELECT jsonb_object_agg(
                    role_name,
                    role_count
                )
                FROM (
                    SELECT
                        COALESCE(role, 'Unassigned') AS role_name,
                        COUNT(*) AS role_count
                    FROM public.profiles
                    GROUP BY COALESCE(role, 'Unassigned')
                    ORDER BY role_name
                ) AS role_summary
            ),
            '{}'::jsonb
        )
    )
    WHERE public.has_permission('manage_users');
$function$;

CREATE OR REPLACE FUNCTION public.get_cross_mine_compliance_summary()
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SET search_path TO 'public'
  AS $function$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'generated_at', now(),
        'mine_count',
        (
            SELECT count(*)
            FROM public.mines AS m
            WHERE public.has_mine_access(m.id)
        ),
        'mines',
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'mine_id', m.id,
                        'mine_code', m.mine_code,
                        'mine_name', m.mine_name,

                        'compliance_total',
                        (
                            SELECT count(*)
                            FROM public.compliance_records AS cr
                            WHERE cr.mine_id = m.id
                        ),

                        'compliance_compliant',
                        (
                            SELECT count(*)
                            FROM public.compliance_records AS cr
                            WHERE cr.mine_id = m.id
                              AND lower(coalesce(cr.status, '')) IN
                                  ('compliant', 'completed')
                        ),

                        'compliance_pending',
                        (
                            SELECT count(*)
                            FROM public.compliance_records AS cr
                            WHERE cr.mine_id = m.id
                              AND lower(coalesce(cr.status, '')) IN
                                  ('pending', 'due', 'in progress')
                        ),

                        'inspection_count',
                        (
                            SELECT count(*)
                            FROM public.inspections AS i
                            WHERE i.mine_id = m.id
                        ),

                        'observation_count',
                        (
                            SELECT count(*)
                            FROM public.observations AS o
                            JOIN public.inspections AS i
                                ON i.id = o.inspection_id
                            WHERE i.mine_id = m.id
                        ),

                        'violation_count',
                        (
                            SELECT count(*)
                            FROM public.violations AS v
                            WHERE v.mine_id = m.id
                        ),

                        'open_violation_count',
                        (
                            SELECT count(*)
                            FROM public.violations AS v
                            WHERE v.mine_id = m.id
                              AND lower(coalesce(v.status, '')) NOT IN
                                  ('closed', 'resolved')
                        ),

                        'corrective_action_count',
                        (
                            SELECT count(*)
                            FROM public.corrective_actions AS ca
                            JOIN public.violations AS v
                                ON v.id = ca.violation_id
                            WHERE v.mine_id = m.id
                        ),

                        'overdue_corrective_action_count',
                        (
                            SELECT count(*)
                            FROM public.corrective_actions AS ca
                            JOIN public.violations AS v
                                ON v.id = ca.violation_id
                            WHERE v.mine_id = m.id
                              AND ca.due_date < CURRENT_DATE
                              AND lower(coalesce(ca.status, '')) NOT IN
                                  ('completed', 'closed', 'verified')
                        ),

                        'unread_alert_count',
                        (
                            SELECT count(*)
                            FROM public.alerts AS a
                            WHERE a.mine_id = m.id
                              AND lower(coalesce(a.status, '')) = 'unread'
                        ),

                        'latest_risk_level',
                        (
                            SELECT ra.risk_level
                            FROM public.risk_assessments AS ra
                            WHERE ra.mine_id = m.id
                            ORDER BY ra.assessment_date DESC, ra.created_at DESC
                            LIMIT 1
                        ),

                        'latest_risk_score',
                        (
                            SELECT ra.risk_score
                            FROM public.risk_assessments AS ra
                            WHERE ra.mine_id = m.id
                            ORDER BY ra.assessment_date DESC, ra.created_at DESC
                            LIMIT 1
                        )
                    )
                    ORDER BY m.mine_code
                )
                FROM public.mines AS m
                WHERE public.has_mine_access(m.id)
            ),
            '[]'::jsonb
        )
    )
    INTO result;

    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_latest_mine_risk_assessment (
  requested_mine_id uuid
)
  RETURNS public.risk_assessments
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
    SELECT ra.*
    FROM public.risk_assessments AS ra
    WHERE ra.mine_id = requested_mine_id
      AND public.has_mine_access(requested_mine_id)
    ORDER BY ra.assessment_date DESC, ra.created_at DESC
    LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_mine_activity_report (
  requested_mine_id   uuid,
  requested_from_date date,
  requested_to_date   date
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SET search_path TO 'public'
  AS $function$
DECLARE
    result jsonb;
BEGIN
    IF requested_from_date IS NULL
       OR requested_to_date IS NULL THEN
        RAISE EXCEPTION 'From date and to date are required';
    END IF;

    IF requested_from_date > requested_to_date THEN
        RAISE EXCEPTION 'From date cannot be after to date';
    END IF;

    IF NOT public.has_mine_access(requested_mine_id) THEN
        RAISE EXCEPTION 'Unauthorized: mine access required';
    END IF;

    SELECT jsonb_build_object(
        'generated_at', now(),
        'from_date', requested_from_date,
        'to_date', requested_to_date,

        'mine',
        (
            SELECT to_jsonb(m)
            FROM public.mines AS m
            WHERE m.id = requested_mine_id
        ),

        'compliance',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(cr)
                    ORDER BY cr.due_date
                )
                FROM public.compliance_records AS cr
                WHERE cr.mine_id = requested_mine_id
                  AND cr.due_date >= requested_from_date
                  AND cr.due_date < requested_to_date + INTERVAL '1 day'
            ),
            '[]'::jsonb
        ),

        'inspections',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(i)
                    ORDER BY i.inspection_date DESC
                )
                FROM public.inspections AS i
                WHERE i.mine_id = requested_mine_id
                  AND i.inspection_date >= requested_from_date
                  AND i.inspection_date < requested_to_date + INTERVAL '1 day'
            ),
            '[]'::jsonb
        ),

        'observations',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(o)
                    ORDER BY o.created_at DESC
                )
                FROM public.observations AS o
                JOIN public.inspections AS i
                    ON i.id = o.inspection_id
                WHERE i.mine_id = requested_mine_id
                  AND i.inspection_date >= requested_from_date
                  AND i.inspection_date < requested_to_date + INTERVAL '1 day'
            ),
            '[]'::jsonb
        ),

        'violations',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(v)
                    ORDER BY v.detected_date DESC
                )
                FROM public.violations AS v
                WHERE v.mine_id = requested_mine_id
                  AND v.detected_date >= requested_from_date
                  AND v.detected_date < requested_to_date + INTERVAL '1 day'
            ),
            '[]'::jsonb
        ),

        'corrective_actions',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(ca)
                    ORDER BY ca.due_date
                )
                FROM public.corrective_actions AS ca
                JOIN public.violations AS v
                    ON v.id = ca.violation_id
                WHERE v.mine_id = requested_mine_id
                  AND (
                      ca.due_date >= requested_from_date
                      AND ca.due_date < requested_to_date + INTERVAL '1 day'
                  )
            ),
            '[]'::jsonb
        ),

        'alerts',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(a)
                    ORDER BY a.created_at DESC
                )
                FROM public.alerts AS a
                WHERE a.mine_id = requested_mine_id
                  AND a.created_at >= requested_from_date
                  AND a.created_at < requested_to_date + INTERVAL '1 day'
            ),
            '[]'::jsonb
        )
    )
    INTO result;

    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_mine_compliance_report (
  requested_mine_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE
  SET search_path TO 'public'
  AS $function$
DECLARE
    report jsonb;
BEGIN
    -- Enforce existing MineGuard mine-level access control
    IF NOT public.has_mine_access(requested_mine_id) THEN
        RAISE EXCEPTION 'Unauthorized: mine access required';
    END IF;

    SELECT jsonb_build_object(
        'generated_at', now(),

        'mine',
        (
            SELECT to_jsonb(m)
            FROM public.mines AS m
            WHERE m.id = requested_mine_id
        ),

        'compliance',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(cr)
                    || jsonb_build_object(
                        'requirement',
                        (
                            SELECT jsonb_build_object(
                                'requirement_code', cqr.requirement_code,
                                'title', cqr.title,
                                'category', cqr.category,
                                'authority', cqr.authority,
                                'frequency', cqr.frequency,
                                'severity_level', cqr.severity_level
                            )
                            FROM public.compliance_requirements AS cqr
                            WHERE cqr.id = cr.requirement_id
                        )
                    )
                    ORDER BY cr.due_date
                )
                FROM public.compliance_records AS cr
                WHERE cr.mine_id = requested_mine_id
            ),
            '[]'::jsonb
        ),

        'inspections',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(i)
                    ORDER BY i.inspection_date DESC
                )
                FROM public.inspections AS i
                WHERE i.mine_id = requested_mine_id
            ),
            '[]'::jsonb
        ),

        'observations',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(o)
                    ORDER BY o.created_at DESC
                )
                FROM public.observations AS o
                JOIN public.inspections AS i
                    ON i.id = o.inspection_id
                WHERE i.mine_id = requested_mine_id
            ),
            '[]'::jsonb
        ),

        'violations',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(v)
                    ORDER BY v.detected_date DESC
                )
                FROM public.violations AS v
                WHERE v.mine_id = requested_mine_id
            ),
            '[]'::jsonb
        ),

        'corrective_actions',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(ca)
                    ORDER BY ca.due_date
                )
                FROM public.corrective_actions AS ca
                JOIN public.violations AS v
                    ON v.id = ca.violation_id
                WHERE v.mine_id = requested_mine_id
            ),
            '[]'::jsonb
        ),

        'alerts',
        COALESCE(
            (
                SELECT jsonb_agg(
                    to_jsonb(a)
                    ORDER BY a.created_at DESC
                )
                FROM public.alerts AS a
                WHERE a.mine_id = requested_mine_id
            ),
            '[]'::jsonb
        ),

        'risk_assessment',
        (
            SELECT to_jsonb(ra)
            FROM public.risk_assessments AS ra
            WHERE ra.mine_id = requested_mine_id
            ORDER BY ra.assessment_date DESC, ra.created_at DESC
            LIMIT 1
        )

    )
    INTO report;

    RETURN report;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_mine_dashboard_summary (
  requested_mine_id uuid
)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
    SELECT jsonb_build_object(

        'mine_id',
        requested_mine_id,

        'compliance',
        (
            SELECT jsonb_build_object(
                'total',
                COUNT(*),
                'completed',
                COUNT(*) FILTER (
                    WHERE cr.status = 'Completed'
                ),
                'pending',
                COUNT(*) FILTER (
                    WHERE cr.status = 'Pending'
                ),
                'overdue',
                COUNT(*) FILTER (
                    WHERE cr.status = 'Overdue'
                ),
                'average_score',
                ROUND(
                    AVG(cr.compliance_score)::numeric,
                    2
                )
            )
            FROM public.compliance_records AS cr
            WHERE cr.mine_id = requested_mine_id
        ),

        'inspections',
        (
            SELECT jsonb_build_object(
                'total',
                COUNT(*),
                'completed',
                COUNT(*) FILTER (
                    WHERE i.overall_status = 'Completed'
                ),
                'open',
                COUNT(*) FILTER (
                    WHERE i.overall_status IS DISTINCT FROM 'Completed'
                )
            )
            FROM public.inspections AS i
            WHERE i.mine_id = requested_mine_id
        ),

        'observations',
        (
            SELECT jsonb_build_object(
                'total',
                COUNT(*),
                'high_severity',
                COUNT(*) FILTER (
                    WHERE o.severity = 'High'
                ),
                'critical',
                COUNT(*) FILTER (
                    WHERE o.severity = 'Critical'
                )
            )
            FROM public.observations AS o
            JOIN public.inspections AS i
                ON i.id = o.inspection_id
            WHERE i.mine_id = requested_mine_id
        ),

        'violations',
        (
            SELECT jsonb_build_object(
                'total',
                COUNT(*),
                'open',
                COUNT(*) FILTER (
                    WHERE v.status = 'Open'
                ),
                'recurring',
                COUNT(*) FILTER (
                    WHERE v.recurring = true
                ),
                'high_severity',
                COUNT(*) FILTER (
                    WHERE v.severity = 'High'
                ),
                'critical',
                COUNT(*) FILTER (
                    WHERE v.severity = 'Critical'
                )
            )
            FROM public.violations AS v
            WHERE v.mine_id = requested_mine_id
        ),

        'corrective_actions',
        (
            SELECT jsonb_build_object(
                'total',
                COUNT(*),
                'pending',
                COUNT(*) FILTER (
                    WHERE ca.status = 'Pending'
                ),
                'completed',
                COUNT(*) FILTER (
                    WHERE ca.status = 'Completed'
                ),
                'overdue',
                COUNT(*) FILTER (
                    WHERE ca.due_date < CURRENT_DATE
                      AND ca.status <> 'Completed'
                ),
                'verified',
                COUNT(*) FILTER (
                    WHERE ca.verification_status = 'Verified'
                )
            )
            FROM public.corrective_actions AS ca
            JOIN public.violations AS v
                ON v.id = ca.violation_id
            WHERE v.mine_id = requested_mine_id
        ),

        'alerts',
        (
            SELECT jsonb_build_object(
                'total',
                COUNT(*),
                'unread',
                COUNT(*) FILTER (
                    WHERE a.status = 'Unread'
                ),
                'high_severity',
                COUNT(*) FILTER (
                    WHERE a.severity = 'High'
                ),
                'critical',
                COUNT(*) FILTER (
                    WHERE a.severity = 'Critical'
                )
            )
            FROM public.alerts AS a
            WHERE a.mine_id = requested_mine_id
        )

    )
    WHERE public.has_mine_access(requested_mine_id);
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_mineguard_users()
  RETURNS TABLE (
    user_id            uuid,
    email              text,
    full_name          text,
    role               text,
    status             text,
    signup_source      text,
    created_at         timestamp with time zone,
    assigned_mine_id   uuid,
    assigned_mine_code text,
    assigned_mine_name text
  )
  LANGUAGE sql
  STABLE
  SET search_path TO 'public'
  AS $function$
    SELECT
        p.id AS user_id,
        p.email,
        p.full_name,
        p.role,
        p.status,
        au.raw_user_meta_data ->> 'signup_source' AS signup_source,
        p.created_at,
        mua.mine_id AS assigned_mine_id,
        m.mine_code AS assigned_mine_code,
        m.mine_name AS assigned_mine_name
    FROM public.profiles AS p
    LEFT JOIN auth.users AS au
        ON au.id = p.id
    LEFT JOIN public.mine_user_assignments AS mua
        ON mua.user_id = p.id
       AND mua.status = 'Active'
    LEFT JOIN public.mines AS m
        ON m.id = mua.mine_id
    WHERE p.status = 'Pending'
      AND public.has_permission('manage_users')
    ORDER BY p.created_at ASC;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    requested_signup_source text;
    initial_status text;
BEGIN
    requested_signup_source :=
        NEW.raw_user_meta_data ->> 'signup_source';

    initial_status :=
        CASE
            WHEN requested_signup_source = 'admin_created'
                THEN 'Active'
            ELSE 'Pending'
        END;

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        status,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name'
        ),
        NEW.email,
        initial_status,
        NULL
    );

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_mine_access (
  requested_mine_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
    SELECT
        EXISTS (
            SELECT 1
            FROM public.profiles AS pr
            WHERE pr.id = auth.uid()
              AND pr.status = 'Active'
              AND public.has_permission('manage_users')
        )
        OR
        EXISTS (
            SELECT 1
            FROM public.profiles AS pr
            JOIN public.mine_user_assignments AS mua
                ON mua.user_id = pr.id
            WHERE pr.id = auth.uid()
              AND pr.status = 'Active'
              AND mua.mine_id = requested_mine_id
              AND mua.status = 'Active'
        );
$function$;

CREATE OR REPLACE FUNCTION public.has_permission (
  requested_permission text
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles AS pr
        JOIN public.role_permissions AS rp
            ON rp.role = pr.role
        JOIN public.permissions AS p
            ON p.id = rp.permission_id
        WHERE pr.id = auth.uid()
          AND pr.status = 'Active'
          AND p.permission_code = requested_permission
    );
$function$;

CREATE OR REPLACE FUNCTION public.queue_document_for_ocr (
  requested_document_id uuid
)
  RETURNS public.documents
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    queued_document public.documents;
BEGIN

    UPDATE public.documents
    SET
        ocr_status = 'Pending',
        ocr_error = NULL,
        ocr_started_at = NULL,
        ocr_completed_at = NULL

    WHERE id = requested_document_id
      AND status = 'Active'
      AND public.has_mine_access(mine_id)

    RETURNING *
    INTO queued_document;


    IF queued_document.id IS NULL THEN
        RAISE EXCEPTION
            'Document not found, archived, or access denied';
    END IF;


    RETURN queued_document;

END;
$function$;

CREATE OR REPLACE FUNCTION public.reactivate_mineguard_user (
  requested_user_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    target_profile public.profiles%ROWTYPE;
BEGIN
    -- Only authorized Admins can reactivate users.
    IF NOT public.has_permission('manage_users') THEN
        RAISE EXCEPTION 'Unauthorized: Admin permission required';
    END IF;

    -- Prevent self-reactivation through this workflow.
    IF requested_user_id = auth.uid() THEN
        RAISE EXCEPTION 'An administrator cannot reactivate their own account';
    END IF;

    -- Load and lock the target profile.
    SELECT *
    INTO target_profile
    FROM public.profiles
    WHERE id = requested_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Only Inactive users can be reactivated.
    IF target_profile.status <> 'Inactive' THEN
        RAISE EXCEPTION
            'User cannot be reactivated because current status is %',
            target_profile.status;
    END IF;

    -- Reactivate the profile.
    UPDATE public.profiles
    SET
        status = 'Active',
        updated_at = now()
    WHERE id = requested_user_id;

    -- Record the administrative action.
    INSERT INTO public.audit_logs (
        actor_id,
        mine_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        metadata
    )
    VALUES (
        auth.uid(),
        NULL,
        'USER_REACTIVATED',
        'profile',
        requested_user_id,
        jsonb_build_object(
            'role', target_profile.role,
            'status', target_profile.status
        ),
        jsonb_build_object(
            'role', target_profile.role,
            'status', 'Active'
        ),
        jsonb_build_object(
            'reactivated_by', auth.uid(),
            'mine_access_restored', false
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', requested_user_id,
        'email', target_profile.email,
        'role', target_profile.role,
        'status', 'Active',
        'mine_access_restored', false
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.retry_failed_document_ocr (
  requested_document_id uuid
)
  RETURNS public.documents
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    updated_document public.documents;
BEGIN

    UPDATE public.documents
    SET
        ocr_status = 'Pending',
        ocr_error = NULL,
        ocr_next_attempt_at = NULL,
        updated_at = now()
    WHERE id = requested_document_id
      AND status = 'Active'
      AND ocr_status = 'Failed'
      AND ocr_attempts < 3
      AND (
            ocr_next_attempt_at IS NULL
            OR ocr_next_attempt_at <= now()
          )
      AND public.has_mine_access(mine_id)
    RETURNING * INTO updated_document;

    IF updated_document.id IS NULL THEN
        RAISE EXCEPTION
            'Document is not eligible for OCR retry';
    END IF;

    RETURN updated_document;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_documents_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_document_ocr (
  requested_document_id uuid
)
  RETURNS public.documents
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    updated_document public.documents;
BEGIN

    UPDATE public.documents
    SET
        ocr_status = 'Processing',
        ocr_started_at = now(),
        ocr_completed_at = NULL,
        ocr_error = NULL,
        ocr_attempts = ocr_attempts + 1,
        ocr_next_attempt_at = NULL,
        updated_at = now()
    WHERE id = requested_document_id
      AND status = 'Active'
      AND ocr_status = 'Pending'
      AND public.has_mine_access(mine_id)
    RETURNING * INTO updated_document;

    IF updated_document.id IS NULL THEN
        RAISE EXCEPTION
            'Document is not available for OCR processing';
    END IF;

    RETURN updated_document;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_document_ocr (
  requested_document_id uuid,
  requested_status      text,
  extracted_text        text DEFAULT NULL::text,
  processing_error      text DEFAULT NULL::text
)
  RETURNS public.documents
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    updated_document public.documents;
BEGIN

    IF requested_status NOT IN (
        'Pending',
        'Processing',
        'Completed',
        'Failed'
    ) THEN
        RAISE EXCEPTION
            'Invalid OCR status: %',
            requested_status;
    END IF;

    UPDATE public.documents
    SET
        ocr_status = requested_status,

        ocr_text = CASE
            WHEN requested_status = 'Completed'
                THEN extracted_text
            ELSE ocr_text
        END,

        ocr_error = CASE
            WHEN requested_status = 'Failed'
                THEN processing_error
            WHEN requested_status = 'Completed'
                THEN NULL
            ELSE ocr_error
        END,

        ocr_started_at = CASE
            WHEN requested_status = 'Processing'
                THEN COALESCE(ocr_started_at, now())
            ELSE ocr_started_at
        END,

        ocr_completed_at = CASE
            WHEN requested_status IN ('Completed', 'Failed')
                THEN now()
            ELSE ocr_completed_at
        END

    WHERE id = requested_document_id
      AND public.has_mine_access(mine_id)

    RETURNING * INTO updated_document;

    IF updated_document.id IS NULL THEN
        RAISE EXCEPTION
            'Document not found or access denied';
    END IF;

    RETURN updated_document;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_mineguard_user_mine (
  requested_user_id uuid,
  requested_mine_id uuid
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    target_profile public.profiles%ROWTYPE;
    target_mine public.mines%ROWTYPE;
    previous_mine_id uuid;
    previous_mine_code text;
    previous_mine_name text;
BEGIN
    -- Only authorized Admins can change mine assignments.
    IF NOT public.has_permission('manage_users') THEN
        RAISE EXCEPTION 'Unauthorized: Admin permission required';
    END IF;

    -- Prevent changing the current administrator's own assignment.
    IF requested_user_id = auth.uid() THEN
        RAISE EXCEPTION 'An administrator cannot change their own mine assignment';
    END IF;

    -- Load and lock target profile.
    SELECT *
    INTO target_profile
    FROM public.profiles
    WHERE id = requested_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Only Active or Inactive users can have mine assignments changed.
    IF target_profile.status NOT IN ('Active', 'Inactive') THEN
        RAISE EXCEPTION
            'Mine assignment cannot be changed while user status is %',
            target_profile.status;
    END IF;

    -- Validate requested mine.
    SELECT *
    INTO target_mine
    FROM public.mines
    WHERE id = requested_mine_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mine not found';
    END IF;

    -- Capture the current active assignment, if any.
    SELECT
        mua.mine_id,
        m.mine_code,
        m.mine_name
    INTO
        previous_mine_id,
        previous_mine_code,
        previous_mine_name
    FROM public.mine_user_assignments AS mua
    JOIN public.mines AS m
        ON m.id = mua.mine_id
    WHERE mua.user_id = requested_user_id
      AND mua.status = 'Active'
    ORDER BY mua.assigned_at DESC
    LIMIT 1;

    -- Deactivate all existing active assignments.
    UPDATE public.mine_user_assignments
    SET status = 'Inactive'
    WHERE user_id = requested_user_id
      AND status = 'Active';

    -- Create or reactivate the requested assignment.
    INSERT INTO public.mine_user_assignments (
        user_id,
        mine_id,
        status
    )
    VALUES (
        requested_user_id,
        requested_mine_id,
        'Active'
    )
    ON CONFLICT (user_id, mine_id)
    DO UPDATE
    SET
        status = 'Active',
        assigned_at = now();

    -- Record the assignment change.
    INSERT INTO public.audit_logs (
        actor_id,
        mine_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        metadata
    )
    VALUES (
        auth.uid(),
        requested_mine_id,
        'USER_MINE_UPDATED',
        'profile',
        requested_user_id,
        jsonb_build_object(
            'mine_id', previous_mine_id,
            'mine_code', previous_mine_code,
            'mine_name', previous_mine_name
        ),
        jsonb_build_object(
            'mine_id', requested_mine_id,
            'mine_code', target_mine.mine_code,
            'mine_name', target_mine.mine_name
        ),
        jsonb_build_object(
            'updated_by', auth.uid()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', requested_user_id,
        'email', target_profile.email,
        'status', target_profile.status,
        'previous_mine_id', previous_mine_id,
        'previous_mine_code', previous_mine_code,
        'previous_mine_name', previous_mine_name,
        'mine_id', requested_mine_id,
        'mine_code', target_mine.mine_code,
        'mine_name', target_mine.mine_name
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_mineguard_user_role (
  requested_user_id uuid,
  requested_role    text
)
  RETURNS jsonb
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
DECLARE
    target_profile public.profiles%ROWTYPE;
BEGIN
    -- Only authorized Admins can change user roles.
    IF NOT public.has_permission('manage_users') THEN
        RAISE EXCEPTION 'Unauthorized: Admin permission required';
    END IF;

    -- Prevent changing the current administrator's own role.
    IF requested_user_id = auth.uid() THEN
        RAISE EXCEPTION 'An administrator cannot change their own role';
    END IF;

    -- Validate role.
    IF requested_role NOT IN (
        'Admin',
        'Subsidiary Admin',
        'Mine Manager',
        'Inspector',
        'Safety Officer',
        'Contractor/Worker'
    ) THEN
        RAISE EXCEPTION 'Invalid role: %', requested_role;
    END IF;

    -- Load and lock target profile.
    SELECT *
    INTO target_profile
    FROM public.profiles
    WHERE id = requested_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Only Active or Inactive users can have their role changed.
    IF target_profile.status NOT IN ('Active', 'Inactive') THEN
        RAISE EXCEPTION
            'User role cannot be changed while status is %',
            target_profile.status;
    END IF;

    -- Do nothing if the role is already the requested role.
    IF target_profile.role = requested_role THEN
        RETURN jsonb_build_object(
            'success', true,
            'user_id', requested_user_id,
            'email', target_profile.email,
            'role', requested_role,
            'status', target_profile.status,
            'changed', false
        );
    END IF;

    -- Update role only.
    UPDATE public.profiles
    SET
        role = requested_role,
        updated_at = now()
    WHERE id = requested_user_id;

    -- Record role change.
    INSERT INTO public.audit_logs (
        actor_id,
        mine_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        metadata
    )
    VALUES (
        auth.uid(),
        NULL,
        'USER_ROLE_UPDATED',
        'profile',
        requested_user_id,
        jsonb_build_object(
            'role', target_profile.role,
            'status', target_profile.status
        ),
        jsonb_build_object(
            'role', requested_role,
            'status', target_profile.status
        ),
        jsonb_build_object(
            'updated_by', auth.uid()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', requested_user_id,
        'email', target_profile.email,
        'old_role', target_profile.role,
        'role', requested_role,
        'status', target_profile.status,
        'changed', true
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.write_audit_log()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
    affected_mine_id uuid;
    affected_entity_id uuid;
    old_snapshot jsonb;
    new_snapshot jsonb;
BEGIN

    -- --------------------------------------------------------
    -- Determine affected entity ID
    -- --------------------------------------------------------

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        affected_entity_id := NEW.id;
    ELSE
        affected_entity_id := OLD.id;
    END IF;


    -- --------------------------------------------------------
    -- Determine mine ID
    -- --------------------------------------------------------

    -- Tables that contain mine_id directly
    IF TG_TABLE_NAME IN (
        'mines',
        'compliance_records',
        'inspections',
        'violations',
        'risk_assessments',
        'documents',
        'alerts'
    ) THEN

        IF TG_OP IN ('INSERT', 'UPDATE') THEN
            affected_mine_id := NEW.mine_id;
        ELSE
            affected_mine_id := OLD.mine_id;
        END IF;


    -- --------------------------------------------------------
    -- Observation → Inspection → Mine
    -- --------------------------------------------------------

    ELSIF TG_TABLE_NAME = 'observations' THEN

        SELECT i.mine_id
        INTO affected_mine_id
        FROM public.inspections AS i
        WHERE i.id = CASE
            WHEN TG_OP IN ('INSERT', 'UPDATE')
                THEN NEW.inspection_id
            ELSE OLD.inspection_id
        END;


    -- --------------------------------------------------------
    -- Corrective Action → Violation → Mine
    -- --------------------------------------------------------

    ELSIF TG_TABLE_NAME = 'corrective_actions' THEN

        SELECT v.mine_id
        INTO affected_mine_id
        FROM public.violations AS v
        WHERE v.id = CASE
            WHEN TG_OP IN ('INSERT', 'UPDATE')
                THEN NEW.violation_id
            ELSE OLD.violation_id
        END;

    END IF;


    -- --------------------------------------------------------
    -- Capture OLD and NEW snapshots
    -- --------------------------------------------------------

    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        old_snapshot := to_jsonb(OLD);
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        new_snapshot := to_jsonb(NEW);
    END IF;


    -- --------------------------------------------------------
    -- Write audit record
    -- --------------------------------------------------------

    INSERT INTO public.audit_logs (
        actor_id,
        mine_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        metadata
    )
    VALUES (
        auth.uid(),
        affected_mine_id,
        TG_OP,
        TG_TABLE_NAME,
        affected_entity_id,
        old_snapshot,
        new_snapshot,
        jsonb_build_object(
            'source', 'database_trigger',
            'table', TG_TABLE_NAME,
            'timestamp', now()
        )
    );


    RETURN COALESCE(NEW, OLD);

END;
$function$;

ALTER TABLE "public"."compliance_records"
  ADD CONSTRAINT "compliance_records_requirement_id_fkey" FOREIGN KEY (requirement_id) REFERENCES public.compliance_requirements(id);

ALTER TABLE "public"."alerts"
  ADD CONSTRAINT "alerts_corrective_action_id_fkey" FOREIGN KEY (corrective_action_id) REFERENCES public.corrective_actions(id);

ALTER TABLE "public"."documents"
  ADD CONSTRAINT "documents_compliance_record_id_fkey" FOREIGN KEY (compliance_record_id) REFERENCES public.compliance_records(id) ON DELETE SET NULL;

ALTER TABLE "public"."documents"
  ADD CONSTRAINT "documents_corrective_action_id_fkey" FOREIGN KEY (corrective_action_id) REFERENCES public.corrective_actions(id) ON DELETE SET NULL;

ALTER TABLE "public"."documents"
  ADD CONSTRAINT "documents_inspection_id_fkey" FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE SET NULL;

ALTER TABLE "public"."alerts"
  ADD CONSTRAINT "alerts_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id);

ALTER TABLE "public"."audit_logs"
  ADD CONSTRAINT "audit_logs_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id) ON DELETE SET NULL;

ALTER TABLE "public"."compliance_records"
  ADD CONSTRAINT "compliance_records_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id);

ALTER TABLE "public"."documents"
  ADD CONSTRAINT "documents_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id) ON DELETE CASCADE;

ALTER TABLE "public"."inspections"
  ADD CONSTRAINT "inspections_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id);

ALTER TABLE "public"."mine_user_assignments"
  ADD CONSTRAINT "mine_user_assignments_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id) ON DELETE CASCADE;

ALTER TABLE "public"."observations"
  ADD CONSTRAINT "observations_inspection_id_fkey" FOREIGN KEY (inspection_id) REFERENCES public.inspections(id);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."inspections"
  ADD CONSTRAINT "inspections_inspector_id_fkey" FOREIGN KEY (inspector_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."mine_user_assignments"
  ADD CONSTRAINT "mine_user_assignments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."risk_assessments"
  ADD CONSTRAINT "risk_assessments_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id);

ALTER TABLE "public"."role_permissions"
  ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;

ALTER TABLE "public"."mines"
  ADD CONSTRAINT "mines_subsidiary_id_fkey" FOREIGN KEY (subsidiary_id) REFERENCES public.subsidiaries(id);

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id);

ALTER TABLE "public"."compliance_records"
  ADD CONSTRAINT "compliance_records_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE "public"."corrective_actions"
  ADD CONSTRAINT "corrective_actions_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES public.users(id);

ALTER TABLE "public"."corrective_actions"
  ADD CONSTRAINT "corrective_actions_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES public.users(id);

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_subsidiary_id_fkey" FOREIGN KEY (subsidiary_id) REFERENCES public.subsidiaries(id);

ALTER TABLE "public"."violations"
  ADD CONSTRAINT "violations_mine_id_fkey" FOREIGN KEY (mine_id) REFERENCES public.mines(id);

ALTER TABLE "public"."violations"
  ADD CONSTRAINT "violations_observation_id_fkey" FOREIGN KEY (observation_id) REFERENCES public.observations(id);

ALTER TABLE "public"."alerts"
  ADD CONSTRAINT "alerts_violation_id_fkey" FOREIGN KEY (violation_id) REFERENCES public.violations(id);

ALTER TABLE "public"."corrective_actions"
  ADD CONSTRAINT "corrective_actions_violation_id_fkey" FOREIGN KEY (violation_id) REFERENCES public.violations(id);

ALTER TABLE "public"."documents"
  ADD CONSTRAINT "documents_violation_id_fkey" FOREIGN KEY (violation_id) REFERENCES public.violations(id) ON DELETE SET NULL;

CREATE VIEW "public"."document_ocr_queue" WITH (security_invoker=true) AS  SELECT id,
    mine_id,
    document_type,
    title,
    storage_path,
    file_name,
    mime_type,
    file_size,
    ocr_status,
    ocr_started_at,
    ocr_completed_at,
    ocr_error,
    created_at,
    updated_at
   FROM public.documents d
  WHERE ((status = 'Active'::text) AND (ocr_status = ANY (ARRAY['Pending'::text, 'Processing'::text])));

CREATE VIEW "public"."document_ocr_worker_queue" WITH (security_invoker=true) AS  SELECT d.id,
    d.mine_id,
    m.mine_code,
    d.file_name,
    d.storage_path,
    d.mime_type,
    d.file_size,
    d.ocr_status,
    d.ocr_attempts,
    d.ocr_next_attempt_at,
    d.ocr_provider,
    d.created_at,
    d.updated_at
   FROM (public.documents d
     JOIN public.mines m ON ((m.id = d.mine_id)))
  WHERE ((d.status = 'Active'::text) AND ((d.ocr_status = 'Pending'::text) OR ((d.ocr_status = 'Failed'::text) AND (d.ocr_attempts < 3) AND ((d.ocr_next_attempt_at IS NULL) OR (d.ocr_next_attempt_at <= now())))));

CREATE INDEX idx_compliance_mine ON public.compliance_records USING btree (mine_id);

CREATE INDEX idx_compliance_status ON public.compliance_records USING btree (status);

CREATE INDEX idx_corrective_status ON public.corrective_actions USING btree (status);

CREATE INDEX idx_corrective_violation ON public.corrective_actions USING btree (violation_id);

CREATE INDEX idx_documents_compliance_record_id ON public.documents USING btree (compliance_record_id);

CREATE INDEX idx_documents_corrective_action_id ON public.documents USING btree (corrective_action_id);

CREATE INDEX idx_documents_created_at ON public.documents USING btree (created_at DESC);

CREATE INDEX idx_documents_document_type ON public.documents USING btree (document_type);

CREATE INDEX idx_documents_inspection_id ON public.documents USING btree (inspection_id);

CREATE INDEX idx_documents_mine_id ON public.documents USING btree (mine_id);

CREATE INDEX idx_documents_ocr_attempts ON public.documents USING btree (ocr_attempts);

CREATE INDEX idx_documents_ocr_processing ON public.documents USING btree (ocr_status, ocr_next_attempt_at, created_at);

CREATE INDEX idx_documents_ocr_queue ON public.documents USING btree (ocr_status, created_at);

CREATE INDEX idx_documents_violation_id ON public.documents USING btree (violation_id);

CREATE INDEX idx_inspections_mine ON public.inspections USING btree (mine_id);

CREATE INDEX idx_mines_state ON public.mines USING btree (state);

CREATE INDEX idx_mines_subsidiary ON public.mines USING btree (subsidiary_id);

CREATE INDEX idx_risk_level ON public.risk_assessments USING btree (risk_level);

CREATE INDEX idx_risk_mine ON public.risk_assessments USING btree (mine_id);

CREATE INDEX idx_violations_mine ON public.violations USING btree (mine_id);

CREATE INDEX idx_violations_status ON public.violations USING btree (status);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER audit_alerts
  AFTER INSERT OR DELETE OR UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_compliance_records
  AFTER INSERT OR DELETE OR UPDATE ON public.compliance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_corrective_actions
  AFTER INSERT OR DELETE OR UPDATE ON public.corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_documents
  AFTER INSERT OR DELETE OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_documents_updated_at();

CREATE TRIGGER audit_inspections
  AFTER INSERT OR DELETE OR UPDATE ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_mines
  AFTER INSERT OR DELETE OR UPDATE ON public.mines
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_observations
  AFTER INSERT OR DELETE OR UPDATE ON public.observations
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_risk_assessments
  AFTER INSERT OR DELETE OR UPDATE ON public.risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE TRIGGER audit_violations
  AFTER INSERT OR DELETE OR UPDATE ON public.violations
  FOR EACH ROW
  EXECUTE FUNCTION public.write_audit_log();

CREATE POLICY "alerts_select_mine_access" ON "public"."alerts"
  FOR SELECT
  TO "authenticated"
  USING (public.has_mine_access(mine_id));

CREATE POLICY "alerts_select_with_permission" ON "public"."alerts"
  FOR SELECT
  TO "authenticated"
  USING (public.has_permission('view_alerts'::text));

CREATE POLICY "audit_logs_select_authorized" ON "public"."audit_logs"
  FOR SELECT
  TO "authenticated"
  USING ((public.has_permission('view_audit_logs'::text) AND ((mine_id IS NULL) OR public.has_mine_access(mine_id))));

CREATE POLICY "compliance_records_select_mine_access" ON "public"."compliance_records"
  FOR SELECT
  TO "authenticated"
  USING (public.has_mine_access(mine_id));

CREATE POLICY "compliance_records_select_with_permission" ON "public"."compliance_records"
  FOR SELECT
  TO "authenticated"
  USING (public.has_permission('view_compliance'::text));

CREATE POLICY "compliance_requirements_select_with_permission" ON "public"."compliance_requirements"
  FOR SELECT
  TO "authenticated"
  USING (public.has_permission('view_compliance'::text));

CREATE POLICY "corrective_actions_insert_mine_access" ON "public"."corrective_actions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.violations v
  WHERE ((v.id = corrective_actions.violation_id) AND public.has_mine_access(v.mine_id)))));

CREATE POLICY "corrective_actions_insert_with_permission" ON "public"."corrective_actions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.has_permission('create_corrective_actions'::text));

CREATE POLICY "corrective_actions_select_mine_access" ON "public"."corrective_actions"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.violations v
  WHERE ((v.id = corrective_actions.violation_id) AND public.has_mine_access(v.mine_id)))));

CREATE POLICY "corrective_actions_select_with_permission" ON "public"."corrective_actions"
  FOR SELECT
  TO "authenticated"
  USING (public.has_permission('view_corrective_actions'::text));

CREATE POLICY "corrective_actions_update_mine_access" ON "public"."corrective_actions"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.violations v
  WHERE ((v.id = corrective_actions.violation_id) AND public.has_mine_access(v.mine_id)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.violations v
  WHERE ((v.id = corrective_actions.violation_id) AND public.has_mine_access(v.mine_id)))));

CREATE POLICY "corrective_actions_update_with_permission" ON "public"."corrective_actions"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_permission('update_corrective_actions'::text))
  WITH CHECK (public.has_permission('update_corrective_actions'::text));

CREATE POLICY "corrective_actions_verify_with_permission" ON "public"."corrective_actions"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_permission('verify_corrective_actions'::text))
  WITH CHECK (public.has_permission('verify_corrective_actions'::text));

CREATE POLICY "documents_insert_authorized" ON "public"."documents"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.has_mine_access(mine_id));

CREATE POLICY "documents_select_authorized" ON "public"."documents"
  FOR SELECT
  TO "authenticated"
  USING (public.has_mine_access(mine_id));

CREATE POLICY "documents_update_authorized" ON "public"."documents"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_mine_access(mine_id))
  WITH CHECK (public.has_mine_access(mine_id));

CREATE POLICY "inspections_insert_mine_access" ON "public"."inspections"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.has_mine_access(mine_id));

CREATE POLICY "inspections_insert_with_permission" ON "public"."inspections"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.has_permission('create_inspections'::text));

CREATE POLICY "inspections_select_mine_access" ON "public"."inspections"
  FOR SELECT
  TO "authenticated"
  USING (public.has_mine_access(mine_id));

CREATE POLICY "inspections_select_with_permission" ON "public"."inspections"
  FOR SELECT
  TO "authenticated"
  USING (public.has_permission('view_inspections'::text));

CREATE POLICY "inspections_update_mine_access" ON "public"."inspections"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_mine_access(mine_id))
  WITH CHECK (public.has_mine_access(mine_id));

CREATE POLICY "inspections_update_with_permission" ON "public"."inspections"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_permission('update_inspections'::text))
  WITH CHECK (public.has_permission('update_inspections'::text));

CREATE POLICY "mine_assignments_select_own_or_admin" ON "public"."mine_user_assignments"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = auth.uid()) OR public.has_permission('manage_users'::text)));

CREATE POLICY "mines_select_mine_access" ON "public"."mines"
  FOR SELECT
  TO "authenticated"
  USING (public.has_mine_access(id));

CREATE POLICY "mines_select_with_permission" ON "public"."mines"
  FOR SELECT
  TO "authenticated"
  USING (public.has_permission('view_mines'::text));

CREATE POLICY "observations_insert_mine_access" ON "public"."observations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inspections i
  WHERE ((i.id = observations.inspection_id) AND public.has_mine_access(i.mine_id)))));

CREATE POLICY "observations_insert_with_permission" ON "public"."observations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.has_permission('create_observations'::text));

CREATE POLICY "observations_select_mine_access" ON "public"."observations"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.inspections i
  WHERE ((i.id = observations.inspection_id) AND public.has_mine_access(i.mine_id)))));

CREATE POLICY "observations_select_with_permission" ON "public"."observations"
  FOR SELECT
  TO "authenticated"
  USING (public.has_permission('view_observations'::text));

CREATE POLICY "permissions_insert_admin_only" ON "public"."permissions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles pr
  WHERE ((pr.id = ( SELECT auth.uid() AS uid)) AND (pr.role = 'Admin'::text) AND (pr.status = 'Active'::text)))));

CREATE POLICY "profiles_select_own_or_admin" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((id = auth.uid()) OR public.has_permission('manage_users'::text)));

CREATE POLICY "violations_insert_mine_access" ON "public"."violations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.has_mine_access(mine_id));

CREATE POLICY "violations_insert_with_permission" ON "public"."violations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.has_permission('create_violations'::text));

CREATE POLICY "violations_select_mine_access" ON "public"."violations"
  FOR SELECT
  TO "authenticated"
  USING (public.has_mine_access(mine_id));

CREATE POLICY "violations_select_with_permission" ON "public"."violations"
  FOR SELECT
  TO "authenticated"
  USING (public.has_permission('view_violations'::text));

CREATE POLICY "violations_update_mine_access" ON "public"."violations"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_mine_access(mine_id))
  WITH CHECK (public.has_mine_access(mine_id));

CREATE POLICY "violations_update_with_permission" ON "public"."violations"
  FOR UPDATE
  TO "authenticated"
  USING (public.has_permission('update_violations'::text))
  WITH CHECK (public.has_permission('update_violations'::text));

CREATE POLICY "mineguard_documents_storage_insert" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'mineguard-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.documents d
  WHERE ((d.storage_path = objects.name) AND public.has_mine_access(d.mine_id))))));

CREATE POLICY "mineguard_documents_storage_select" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'mineguard-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.documents d
  WHERE ((d.storage_path = objects.name) AND public.has_mine_access(d.mine_id))))));

CREATE POLICY "mineguard_documents_storage_update" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'mineguard-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.documents d
  WHERE ((d.storage_path = objects.name) AND public.has_mine_access(d.mine_id))))))
  WITH CHECK (((bucket_id = 'mineguard-documents'::text) AND (EXISTS ( SELECT 1
   FROM public.documents d
  WHERE ((d.storage_path = objects.name) AND public.has_mine_access(d.mine_id))))));

REVOKE ALL ON FUNCTION "public"."approve_mineguard_user"(uuid, text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."approve_mineguard_user"(uuid, text, uuid) TO "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."calculate_mine_risk_assessment"(uuid) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."complete_document_ocr"(uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."complete_document_ocr"(uuid, text, text, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."deactivate_mineguard_user"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."deactivate_mineguard_user"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."fail_document_ocr"(uuid, text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."fail_document_ocr"(uuid, text, integer) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."generate_automated_alerts"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."generate_automated_alerts"() TO "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_accessible_mines"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_admin_active_users"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_admin_active_users"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_admin_mine_list"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_admin_mine_list"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_admin_user_management_summary"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_admin_user_management_summary"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_cross_mine_compliance_summary"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_cross_mine_compliance_summary"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_latest_mine_risk_assessment"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_latest_mine_risk_assessment"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_mine_activity_report"(uuid, date, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_mine_activity_report"(uuid, date, date) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_mine_compliance_report"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_mine_compliance_report"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_mine_dashboard_summary"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_mine_dashboard_summary"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_pending_mineguard_users"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_pending_mineguard_users"() TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."has_mine_access"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."has_mine_access"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."has_permission"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."has_permission"(text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."queue_document_for_ocr"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."queue_document_for_ocr"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."reactivate_mineguard_user"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."reactivate_mineguard_user"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."retry_failed_document_ocr"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."retry_failed_document_ocr"(uuid) TO "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_documents_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."start_document_ocr"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."start_document_ocr"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_document_ocr"(uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_document_ocr"(uuid, text, text, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_mineguard_user_mine"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_mineguard_user_mine"(uuid, uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_mineguard_user_role"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_mineguard_user_role"(uuid, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."write_audit_log"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."write_audit_log"() TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."alerts" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_logs" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."compliance_records" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."compliance_requirements" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."corrective_actions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."documents" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inspections" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."mine_user_assignments" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."mines" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."observations" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."permissions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."risk_assessments" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."role_permissions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subsidiaries" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."violations" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."document_ocr_queue" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."document_ocr_worker_queue" TO "anon", "authenticated", "postgres", "service_role";

