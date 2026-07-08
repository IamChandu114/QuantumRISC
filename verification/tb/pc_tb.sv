`timescale 1ns / 1ps

//////////////////////////////////////////////////////////////////////////////////
// Project : QuantumRISC
// Testbench : Program Counter
//////////////////////////////////////////////////////////////////////////////////

module pc_tb;

    logic clk;
    logic reset;
    logic enable;
    logic [31:0] pc_next;
    logic [31:0] pc_current;

    // Device Under Test
    pc dut (
        .clk(clk),
        .reset(reset),
        .enable(enable),
        .pc_next(pc_next),
        .pc_current(pc_current)
    );

    //---------------------------------------------------------
    // Clock Generation
    //---------------------------------------------------------
    initial begin
        clk = 0;
        forever #5 clk = ~clk;
    end

    //---------------------------------------------------------
    // Test Sequence
    //---------------------------------------------------------
    initial begin

        $display("----------------------------------------");
        $display(" QuantumRISC Program Counter Test");
        $display("----------------------------------------");

        reset   = 1;
        enable  = 0;
        pc_next = 32'h00000000;

        #12;

        //-----------------------------------------------------
        // Reset Test
        //-----------------------------------------------------
        reset = 0;

        if (pc_current == 32'h00000000)
            $display("[PASS] Reset Test");
        else
            $display("[FAIL] Reset Test");

        //-----------------------------------------------------
        // Load Address 4
        //-----------------------------------------------------
        enable  = 1;
        pc_next = 32'h00000004;

        #10;

        if (pc_current == 32'h00000004)
            $display("[PASS] PC = 4");
        else
            $display("[FAIL] PC = 4");

        //-----------------------------------------------------
        // Load Address 8
        //-----------------------------------------------------
        pc_next = 32'h00000008;

        #10;

        if (pc_current == 32'h00000008)
            $display("[PASS] PC = 8");
        else
            $display("[FAIL] PC = 8");

        //-----------------------------------------------------
        // Hold Value
        //-----------------------------------------------------
        enable  = 0;
        pc_next = 32'h0000000C;

        #10;

        if (pc_current == 32'h00000008)
            $display("[PASS] Hold Test");
        else
            $display("[FAIL] Hold Test");

        //-----------------------------------------------------
        // Resume Updating
        //-----------------------------------------------------
        enable = 1;

        #10;

        if (pc_current == 32'h0000000C)
            $display("[PASS] Resume Test");
        else
            $display("[FAIL] Resume Test");

        //-----------------------------------------------------
        // Finish
        //-----------------------------------------------------
        $display("----------------------------------------");
        $display(" All PC Tests Completed");
        $display("----------------------------------------");

        $finish;

    end

endmodule